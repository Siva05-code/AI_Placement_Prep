const API_BASE = resolveApiBase();

const resumeFileInput = document.getElementById("resumeFile");
const resumeStatus = document.getElementById("resumeStatus");
const jobDescriptionInput = document.getElementById("jobDescription");
const modeButtons = Array.from(document.querySelectorAll(".mode-card"));
const generateBtn = document.getElementById("generateBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");
const outputEl = document.getElementById("output");
const loadingEl = document.getElementById("loading");
const errorBox = document.getElementById("errorBox");

const state = {
  selectedMode: "aptitude",
  resumeId: "",
  outputText: "",
  questionCards: [],
};

function resolveApiBase() {
  const explicitBase =
    window.FLINDER_API_BASE || new URLSearchParams(window.location.search).get("apiBase");

  if (explicitBase) {
    return explicitBase.replace(/\/$/, "");
  }

  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return "http://127.0.0.1:8000";
  }

  return `${window.location.origin}/api`;
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    modeButtons.forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    state.selectedMode = button.dataset.mode;
  });
});

resumeFileInput.addEventListener("change", async () => {
  hideError();

  const file = resumeFileInput.files?.[0];
  if (!file) {
    state.resumeId = "";
    resumeStatus.textContent = "No resume uploaded yet.";
    return;
  }

  const extension = file.name.toLowerCase();
  if (!(extension.endsWith(".pdf") || extension.endsWith(".txt"))) {
    showError("Only PDF or TXT files are supported for resume upload.");
    resumeFileInput.value = "";
    state.resumeId = "";
    return;
  }

  setLoading(true, "Uploading and extracting resume...");

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${API_BASE}/upload_resume`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Resume upload failed.");
    }

    state.resumeId = data.resume_id;
    resumeStatus.textContent = `Uploaded: ${file.name} (${data.extracted_chars} chars extracted)`;
  } catch (error) {
    state.resumeId = "";
    resumeStatus.textContent = "Resume upload failed.";
    showError(error.message || "Could not upload resume.");
  } finally {
    setLoading(false);
  }
});

generateBtn.addEventListener("click", async () => {
  hideError();

  const jobDescription = jobDescriptionInput.value.trim();

  if (!state.resumeId) {
    showError("Please upload a resume before generating questions.");
    return;
  }

  if (jobDescription.length < 30) {
    showError("Please paste a meaningful job description (at least 30 characters).");
    return;
  }

  setLoading(true, "Generating personalized content...");
  outputEl.innerHTML = "<p class='placeholder'>Generating output, please wait...</p>";

  try {
    const response = await fetch(`${API_BASE}/generate_questions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resume_id: state.resumeId,
        job_description: jobDescription,
        mode: state.selectedMode,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Generation failed.");
    }

    state.outputText = data.content;
    renderOutputAsCards(state.outputText);
  } catch (error) {
    outputEl.innerHTML = "<p class='placeholder'>Your generated content will appear here.</p>";
    showError(error.message || "Could not generate preparation content.");
  } finally {
    setLoading(false);
  }
});

copyBtn.addEventListener("click", async () => {
  if (!state.outputText) {
    showError("No output available to copy yet.");
    return;
  }

  try {
    await navigator.clipboard.writeText(state.outputText);
    copyBtn.textContent = "Copied";
    setTimeout(() => {
      copyBtn.textContent = "Copy Output";
    }, 1400);
  } catch {
    showError("Clipboard permission denied. Copy manually from the output panel.");
  }
});

clearBtn.addEventListener("click", () => {
  resumeFileInput.value = "";
  jobDescriptionInput.value = "";
  state.resumeId = "";
  state.outputText = "";
  state.questionCards = [];
  state.selectedMode = "aptitude";

  modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === "aptitude");
  });

  resumeStatus.textContent = "No resume uploaded yet.";
  outputEl.innerHTML =
    "<p class='placeholder'>Your generated questions will appear as cards with answers and doubt chat.</p>";
  hideError();
});

outputEl.addEventListener("click", async (event) => {
  const askBtn = event.target.closest(".ask-doubt-btn");
  if (!askBtn) {
    return;
  }

  const index = Number(askBtn.dataset.index || "-1");
  const card = state.questionCards[index];
  if (!card) {
    showError("Could not find this question card. Please generate again.");
    return;
  }

  const input = outputEl.querySelector(`[data-doubt-input='${index}']`);
  const chatLog = outputEl.querySelector(`[data-chat-log='${index}']`);
  if (!input || !chatLog) {
    showError("Could not open chat for this card.");
    return;
  }

  const doubt = input.value.trim();
  if (doubt.length < 3) {
    showError("Please type your doubt with at least 3 characters.");
    return;
  }

  hideError();
  appendChatMessage(chatLog, "You", doubt, "user");
  input.value = "";
  askBtn.disabled = true;
  askBtn.textContent = "Thinking...";

  try {
    const response = await fetch(`${API_BASE}/clarify_question`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: state.selectedMode,
        question: card.question,
        expected_answer: card.answer,
        doubt,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Failed to get clarification.");
    }

    appendChatMessage(chatLog, "Coach", data.clarification, "assistant");
  } catch (error) {
    appendChatMessage(
      chatLog,
      "Coach",
      "I could not answer that right now. Please retry in a moment.",
      "assistant"
    );
    showError(error.message || "Clarification request failed.");
  } finally {
    askBtn.disabled = false;
    askBtn.textContent = "Ask";
  }
});

function setLoading(isLoading, message = "") {
  loadingEl.classList.toggle("hidden", !isLoading);
  if (message) {
    loadingEl.querySelector("span:last-child").textContent = message;
  }
  generateBtn.disabled = isLoading;
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

function hideError() {
  errorBox.classList.add("hidden");
  errorBox.textContent = "";
}

function renderOutputAsCards(text) {
  const parsed = parseGeneratedOutput(text);
  state.questionCards = parsed.cards;

  if (parsed.cards.length === 0) {
    outputEl.innerHTML = `<div class="section-card"><h3>Generated Content</h3><p>${escapeHtml(text)}</p></div>`;
    return;
  }

  const summaryBlock =
    parsed.summary.length > 0
      ? `<article class="section-card summary-card"><h3>Profile Match Summary</h3><ul>${parsed.summary
          .map((point) => `<li>${escapeHtml(point)}</li>`)
          .join("")}</ul></article>`
      : "";

  const cardsHtml = parsed.cards
    .map(
      (card, index) => `
      <article class="question-card">
        <div class="question-card-head">
          <span class="q-badge">Q${index + 1}</span>
          <p class="q-section">${escapeHtml(card.section)}</p>
        </div>
        <h3>${escapeHtml(card.question)}</h3>
        <div class="answer-block">
          <p class="answer-title">Suggested Answer</p>
          <p>${formatText(card.answer)}</p>
        </div>
        <div class="doubt-chat">
          <p class="chat-title">Ask Doubt on This Question</p>
          <div class="chat-log" data-chat-log="${index}"></div>
          <div class="chat-input-row">
            <textarea data-doubt-input="${index}" rows="2" placeholder="Example: Why is this approach better than brute force?"></textarea>
            <button type="button" class="btn btn-primary ask-doubt-btn" data-index="${index}">Ask</button>
          </div>
        </div>
      </article>
    `
    )
    .join("");

  outputEl.innerHTML = `${summaryBlock}${cardsHtml}`;
}

function parseGeneratedOutput(text) {
  const lines = text.split("\n");
  const summary = [];
  const cards = [];
  let currentSection = "Generated Questions";
  let currentCard = null;

  for (const line of lines) {
    const trimmed = line.trim();
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);
    if (headingMatch) {
      if (currentCard) {
        cards.push(currentCard);
        currentCard = null;
      }
      currentSection = headingMatch[1].trim();
      continue;
    }

    if (/profile match summary/i.test(currentSection) && /^[-*]\s+/.test(trimmed)) {
      summary.push(trimmed.replace(/^[-*]\s+/, ""));
      continue;
    }

    const questionMatch = trimmed.match(/^\d+[.)]\s+(.+)/);
    if (questionMatch) {
      if (currentCard) {
        cards.push(currentCard);
      }
      currentCard = {
        section: currentSection,
        question: questionMatch[1].trim(),
        answerLines: [],
      };
      continue;
    }

    if (currentCard && trimmed) {
      currentCard.answerLines.push(trimmed.replace(/^answer\s*[:.-]?\s*/i, ""));
    }
  }

  if (currentCard) {
    cards.push(currentCard);
  }

  return {
    summary,
    cards: cards.map((card) => ({
      section: card.section,
      question: card.question,
      answer: card.answerLines.join(" ") || "No answer generated.",
    })),
  };
}

function appendChatMessage(chatLog, sender, text, type) {
  const bubble = document.createElement("article");
  bubble.className = `chat-bubble ${type}`;
  bubble.innerHTML = `<p class="chat-sender">${escapeHtml(sender)}</p><p>${formatText(text)}</p>`;
  chatLog.appendChild(bubble);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function formatText(value) {
  return escapeHtml(value).replaceAll("\n", "<br />");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
