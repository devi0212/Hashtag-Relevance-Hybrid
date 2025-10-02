// Inject styles
const style = document.createElement("style");
style.innerHTML = `
  [data-testid="tweet"], /* Twitter/X */
  article, /* Generic */
  .post, /* Facebook generic */
  .x1lliihq, /* Facebook post block */
  .x1iorvi4, /* Facebook inner block */
  .x1yztbdb, /* Facebook text content */
  .x1a2a7pz, /* Instagram post container */
  ._aabd, /* Instagram post wrapper */
  .feed-shared-update-v2 /* LinkedIn */ {
    cursor: pointer !important;
    outline: 2px dashed #5a5aff;
    outline-offset: -2px;
  }

  [data-testid="tweet"]:hover,
  article:hover,
  .post:hover,
  .x1lliihq:hover,
  .x1iorvi4:hover,
  .x1yztbdb:hover,
  .x1a2a7pz:hover,
  ._aabd:hover,
  .feed-shared-update-v2:hover {
    outline: 2px solid #00bfff;
    transition: outline 0.2s ease;
  }
`;
document.head.appendChild(style);
document.body.style.userSelect = "none";

// Extract and send text and hashtags
function extractAndSendData(element) {
  if (!element) return console.warn("No element clicked");

  const text = element.innerText || element.textContent || "";
  if (!text.trim()) return console.warn("Clicked element has no text.");

  const hashtags = (text.match(/#[\w]+/g) || []).join(" ");

  fetch('http://localhost:5000/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tweet: text, hashtags: hashtags })
  })
    .then(res => res.json())
    .then(data => {
      const decision = data.final_decision || "unknown";
      const similarity = data.semantic_similarity?.toFixed(2) || "N/A";
      showPopup(`🧠 ${decision.toUpperCase()} (Similarity: ${similarity})`);
    })
    .catch(err => console.error('Prediction API error:', err));
}

// Show popup
function showPopup(message) {
  const existingPopup = document.querySelector("#classifier-popup");
  if (existingPopup) existingPopup.remove();

  const popup = document.createElement("div");
  popup.id = "classifier-popup";
  popup.innerText = message;
  popup.style.position = "fixed";
  popup.style.bottom = "20px";
  popup.style.right = "20px";
  popup.style.padding = "12px 20px";
  popup.style.backgroundColor = "#333";
  popup.style.color = "#fff";
  popup.style.fontSize = "16px";
  popup.style.borderRadius = "10px";
  popup.style.zIndex = 10000;
  popup.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 5000);
}

// Attach click listeners
function attachClickListeners() {
  const selectors = [
    '[data-testid="tweet"]', // Twitter/X
    'article', // Generic
    '.post', '.x1lliihq', '.x1iorvi4', '.x1yztbdb', // Facebook
    '._aabd', '.x1a2a7pz', // Instagram
    '.feed-shared-update-v2' // LinkedIn
  ];

  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(post => {
      if (!post.classList.contains("listener-attached")) {
        post.classList.add("listener-attached");
        post.addEventListener("click", (e) => {
          e.stopPropagation();
          extractAndSendData(post);
        });
      }
    });
  });
}

// Watch for DOM updates and re-attach listeners
const observer = new MutationObserver(attachClickListeners);
observer.observe(document.body, { childList: true, subtree: true });

// Initial setup
attachClickListeners();
