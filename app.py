from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from transformers import BertTokenizer, BertForSequenceClassification
from sentence_transformers import SentenceTransformer, util

app = Flask(__name__)
CORS(app)

tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
model_classifier = BertForSequenceClassification.from_pretrained("trained")
model_classifier.eval()  
sbert_model = SentenceTransformer('all-MiniLM-L6-v2')

def preprocess_hashtags(hashtags):
    return ' '.join(tag.lstrip('#') for tag in hashtags.split())

def semantic_similarity(tweet, hashtags):
    hashtags = preprocess_hashtags(hashtags)  
    embeddings = sbert_model.encode([tweet, hashtags], convert_to_tensor=True)
    similarity = util.pytorch_cos_sim(embeddings[0], embeddings[1]).item()  
    return similarity


def predict_classifier(tweet):
    inputs = tokenizer(tweet, return_tensors="pt", truncation=True, padding=True, max_length=128)
    with torch.no_grad():
        outputs = model_classifier(**inputs)  
    logits = outputs.logits  
    probabilities = torch.nn.functional.softmax(logits, dim=-1) 
    prediction = torch.argmax(probabilities).item()  
    return prediction

def hybrid_predict(tweet, hashtags):
    sim_score = semantic_similarity(tweet, hashtags)  
    classifier_pred = predict_classifier(tweet)  

    if sim_score < 0.25:
        decision = "❌ Incoherent : The hashtags don't match the tweet!"
    else:
        if classifier_pred == 1:  
            decision = "✅ Coherent : That tweet and hashtags are a match!"
        else:
            decision = "❌ Incoherent : The tweet doesn't match the hashtags."
    
    return f"{decision} (Similarity: {sim_score:.2f})"

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()  
    tweet = data["tweet"]  
    hashtags = data["hashtags"]  

    similarity_score = semantic_similarity(tweet, hashtags)  
    classifier_prediction = predict_classifier(tweet)  

    result = {
        "semantic_similarity": similarity_score,
        "classifier_prediction": classifier_prediction,  
        "final_decision": "Hashtags coherent" if similarity_score >= 0.25 and classifier_prediction == 1 else "Spam Hashtags"  # Final decision based on similarity
    }

    return jsonify(result)  

if __name__ == "__main__":
    app.run(port=5000)  
