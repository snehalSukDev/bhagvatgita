from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


class Verse(BaseModel):
  reference: str
  sanskrit: str
  translation: str


class GuideRequest(BaseModel):
  message: str


class GuideResponse(BaseModel):
  emotion: str
  topic: str
  verse: Verse
  response: str
  reflectionQuestion: str
  isCrisis: bool


class ReflectRequest(BaseModel):
  text: str
  age: int = 0
  language: str = "English"


class ReflectMetadata(BaseModel):
  id: str
  chapter: int
  verse: int
  topics: str
  meaning: str


class ReflectResponse(BaseModel):
  verse_sanskrit_english: str
  translation: str
  personalized_wisdom: str
  reflection_question: str
  metadata: ReflectMetadata


app = FastAPI(title="Gita Mind Guide API")

app.add_middleware(
  CORSMiddleware,
  allow_origins=["http://localhost:3000"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)


CRISIS_KEYWORDS: List[str] = [
  "suicide",
  "kill myself",
  "end my life",
  "self-harm",
  "self harm",
  "cut myself",
  "die",
]


def detect_crisis(text: str) -> bool:
  lowered = text.lower()
  return any(keyword in lowered for keyword in CRISIS_KEYWORDS)


def basic_emotion_and_topic(text: str) -> tuple[str, str]:
  lowered = text.lower()
  if any(word in lowered for word in ["worthless", "ashamed", "shame", "embarrassed"]):
    return "Shame / Low self-worth", "Failure and self-worth"
  if any(word in lowered for word in ["failed", "exam", "results", "marks", "score"]):
    return "Disappointment", "Failure and attachment to results"
  if any(word in lowered for word in ["anxious", "anxiety", "stressed", "pressure"]):
    return "Anxiety", "Overthinking outcomes"
  if any(word in lowered for word in ["breakup", "relationship", "heartbroken", "alone"]):
    return "Grief / Loneliness", "Attachment and relationships"
  if any(word in lowered for word in ["tired", "giving up", "give up", "exhausted"]):
    return "Exhaustion / Hopelessness", "Perseverance and purpose"
  return "Unclear / Mixed", "Understanding your situation"


VERSE_KARMA_YOGA = Verse(
  reference="Chapter 2, Verse 47",
  sanskrit=(
    "karmaṇy evādhikāras te\n"
    "mā phaleṣu kadācana\n"
    "mā karma-phala-hetur bhūr\n"
    "mā te saṅgo 'stv akarmaṇi"
  ),
  translation=(
    "You have a right to perform your prescribed duties, but you are not entitled "
    "to the fruits of your actions. Never consider yourself the cause of the results "
    "of your activities, and never be attached to not doing your duty."
  ),
)


VERSE_STEADY_MIND = Verse(
  reference="Chapter 2, Verse 48",
  sanskrit=(
    "yoga-sthaḥ kuru karmāṇi\n"
    "saṅgaṁ tyaktvā dhanañjaya\n"
    "siddhy-asiddhyoḥ samo bhūtvā\n"
    "samatvaṁ yoga ucyate"
  ),
  translation=(
    "Perform your duties, O Arjuna, being steadfast in yoga, abandoning attachment, "
    "and remaining even-minded in success and failure. Such equanimity is called yoga."
  ),
)


VERSE_GENERAL_CONSOLATION = Verse(
  reference="Chapter 18, Verse 66",
  sanskrit=(
    "sarva-dharmān parityajya\n"
    "mām ekaṁ śaraṇaṁ vraja\n"
    "ahaṁ tvāṁ sarva-pāpebhyo\n"
    "mokṣayiṣyāmi mā śucaḥ"
  ),
  translation=(
    "Abandon all varieties of duty and simply surrender unto Me. I shall deliver "
    "you from all sinful reactions. Do not fear."
  ),
)


def choose_verse(text: str) -> Verse:
  lowered = text.lower()
  if any(word in lowered for word in ["results", "marks", "score", "promotion", "job", "interview", "hard work", "failed"]):
    return VERSE_KARMA_YOGA
  if any(word in lowered for word in ["anxious", "anxiety", "stress", "stressed", "pressure", "overthinking"]):
    return VERSE_STEADY_MIND
  return VERSE_GENERAL_CONSOLATION


def build_explanation(message: str, emotion: str, topic: str, verse: Verse) -> GuideResponse:
  if detect_crisis(message):
    crisis_text = (
      "Your life is precious, and the pain you are feeling right now is very real. "
      "I am a spiritual companion, not a doctor or emergency service, so I cannot "
      "safely guide you alone through thoughts of self-harm or suicide.\n\n"
      "In the spirit of the Bhagavad Gita, your life is a sacred journey, even when "
      "the path feels unbearably dark. Please reach out right now to someone who can "
      "hold you in this moment:\n\n"
      "• If you are in immediate danger, contact your local emergency number.\n"
      "• Call a trusted mental health helpline in your country.\n"
      "• Speak to a therapist, counselor, or a trusted person in your life.\n\n"
      "You do not have to carry this alone. Reaching out is an act of courage, not weakness."
    )
    return GuideResponse(
      emotion="Crisis / Self-harm risk",
      topic="Immediate safety and support",
      verse=VERSE_GENERAL_CONSOLATION,
      response=crisis_text,
      reflectionQuestion="Who is one safe, caring person or service you can reach out to right now?",
      isCrisis=True,
    )

  if verse.reference == VERSE_KARMA_YOGA.reference:
    response_text = (
      "It sounds like you have been pouring your heart into your efforts and the outcome "
      "has left you feeling defeated. In modern life, this often looks like studying hard "
      "for an exam, giving everything to a project, or trying sincerely in a job or "
      "relationship, only to see results that feel unfair.\n\n"
      "In this verse, Krishna gently reminds Arjuna that our true power lies in the sincerity "
      "and integrity of our actions, not in the final scoreboard of success or failure. "
      "Imagine someone training for months for a race. On the day of the event, unexpected rain "
      "slows them down and they do not win. From the world's perspective, they 'lost'. But from "
      "the Gita's perspective, every disciplined morning, every moment of honest effort, and "
      "every bit of growth in character was already a deep success.\n\n"
      "This verse invites you to loosen the tight knot between your self-worth and your latest "
      "result. Your effort, courage, and sincerity are meaningful, even when the outcome does "
      "not match your hopes."
    )
    reflection = (
      "If you gently separated your value as a person from this one result, "
      "what would you allow yourself to see and appreciate about your effort?"
    )
  elif verse.reference == VERSE_STEADY_MIND.reference:
    response_text = (
      "You seem to be carrying a mind that keeps swinging between hope and fear, success and "
      "failure in your imagination. In modern terms, it is like refreshing exam results, "
      "email, or messages again and again, living in a storm of 'what if'.\n\n"
      "Krishna describes yoga here as a steady inner state where you still act with care, "
      "but you are not constantly tossed around by the fear of failure or the hunger for "
      "praise. Picture yourself working on a long-term project: instead of obsessing over "
      "how others will judge the final outcome, you bring your attention back to doing the "
      "next small step well, with calm breathing and a quieter heart.\n\n"
      "The verse is not asking you to stop caring; it is inviting you to care from a grounded, "
      "centered place rather than from panic."
    )
    reflection = (
      "What is one small action you can take today with a steadier mind, "
      "focusing on the step itself rather than the outcome?"
    )
  else:
    response_text = (
      "You may be feeling lost, guilty, or unsure about where your life is heading. "
      "When everything feels heavy, it is easy to think you must solve everything alone.\n\n"
      "In this verse, Krishna offers a deep reassurance: you do not have to carry the entire "
      "universe on your shoulders. Just as a child can rest when held by someone they trust, "
      "you are invited to lean into something higher than your present confusion—whether you "
      "call it God, the universe, or a quiet, guiding wisdom within.\n\n"
      "This is not an instruction to run away from responsibilities. It is a reminder that "
      "you are supported, even when you cannot see the full picture yet."
    )
    reflection = (
      "If you allowed yourself to be gently supported for a moment, "
      "what burden would you admit is too heavy to carry alone?"
    )

  return GuideResponse(
    emotion=emotion,
    topic=topic,
    verse=verse,
    response=response_text,
    reflectionQuestion=reflection,
    isCrisis=False,
  )


@app.post("/guide", response_model=GuideResponse)
def guide(request: GuideRequest) -> GuideResponse:
  message = request.message.strip()
  if not message:
    verse = VERSE_GENERAL_CONSOLATION
    return GuideResponse(
      emotion="Unclear / Mixed",
      topic="Opening up",
      verse=verse,
      response=(
        "Sometimes it is hard to even find the words for what you feel. That is okay. "
        "The Gita invites you to begin exactly where you are, without pretending to be fine.\n\n"
        "If you gently describe even one small part of what is weighing on your heart, "
        "that is already a meaningful beginning."
      ),
      reflectionQuestion="If you could name just one feeling you are carrying, what would it be?",
      isCrisis=False,
    )

  emotion, topic = basic_emotion_and_topic(message)
  verse = choose_verse(message)
  return build_explanation(message, emotion, topic, verse)


@app.post("/api/v1/reflect", response_model=ReflectResponse)
def reflect(request: ReflectRequest) -> ReflectResponse:
  message = request.text.strip()
  
  # For now, we reuse the existing logic to pick a verse and generate wisdom
  # This matches the user's requested response structure
  emotion, topic = basic_emotion_and_topic(message)
  verse = choose_verse(message)
  
  # Map to the new response format requested by user
  # Creating a more "personalized" wisdom based on the existing build_explanation logic
  guide = build_explanation(message, emotion, topic, verse)
  
  # Extract IDs for metadata (Chapter X, Verse Y)
  import re
  ref_match = re.search(r"Chapter (\d+), Verse (\d+)", verse.reference)
  chapter = int(ref_match.group(1)) if ref_match else 0
  verse_num = int(ref_match.group(2)) if ref_match else 0
  
  return ReflectResponse(
    verse_sanskrit_english=f"{verse.sanskrit}. {verse.translation}",
    translation=verse.translation,
    personalized_wisdom=guide.response,
    reflection_question=guide.reflectionQuestion if not guide.isCrisis else "",
    metadata=ReflectMetadata(
      id=f"bg-{chapter}-{verse_num}",
      chapter=chapter,
      verse=verse_num,
      topics=topic.lower().replace(" ", ","),
      meaning=verse.translation
    )
  )

