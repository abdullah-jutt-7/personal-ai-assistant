import json, random, string

OUTPUT_FILE = "models/datasets/intellitext_data.jsonl"
used = set()
data = []

def add(q,a):
    k = q.lower().strip()
    if k not in used:
        used.add(k)
        data.append({"instruction": q, "response": a})

# ================= IDENTITY =================
identity = [
    "What is your name?","Who are you?","Identify yourself",
    "What is your AI name?","Tell me your name"
]
for q in identity:
    add(q,"My name is Intellitext, your personal AI assistant.")

# ================= STUDY ASSISTANT =================
subjects = ["math","physics","chemistry","biology","english","computer science","history","geography"]
for s in subjects:
    add(f"Help me study {s}", f"I can help you study {s} with concepts, notes, practice questions, and explanations.")
    add(f"Make a study plan for {s}", f"Here is a structured study plan for {s}: daily revision, practice, and concept building.")
    add(f"Explain {s} simply", f"{s.capitalize()} is a subject that teaches core concepts in a simple way.")

# ================= TIME MANAGEMENT =================
tasks = ["study","work","coding","exercise","reading","revision","sleep","projects"]
for t in tasks:
    add(f"Make a daily schedule for {t}", f"Here is a daily schedule for {t} with balanced breaks and productivity.")
    add(f"Help me manage time for {t}", f"I will help you manage time for {t} using priority planning and focus blocks.")
    add(f"Create a routine for {t}", f"Here is a healthy routine for {t} with time blocks.")

# ================= CODING ASSISTANT =================
langs = ["Python","Java","C++","JavaScript","PHP","Go"]
for l in langs:
    add(f"Help me learn {l}", f"I will guide you step by step to learn {l}.")
    add(f"Create a roadmap for {l}", f"Here is a beginner to advanced roadmap for {l}.")
    add(f"Explain {l} basics", f"{l} basics include syntax, variables, loops, and functions.")
    add(f"Debug my {l} code", f"I can help debug your {l} code.")

# ================= DECISION MAKING =================
decisions = ["career","study","business","investment","education","skills","job","projects"]
for d in decisions:
    add(f"Help me decide about {d}", f"I will help you analyze options and make a smart decision about {d}.")
    add(f"I am confused about {d}", f"Let’s break down your {d} options logically.")
    add(f"Guide me in {d} decision", f"I will guide you step by step in {d} decision making.")

# ================= DAILY LIFE =================
life_tasks = ["shopping","cooking","cleaning","planning","fitness","diet","routine","habits"]
for t in life_tasks:
    add(f"Help me with {t}", f"I can help you with {t} planning and guidance.")
    add(f"Make a plan for {t}", f"Here is a simple plan for {t}.")
    add(f"Guide me in {t}", f"I will guide you step by step in {t}.")

# ================= MEDICINE & HEALTH =================
symptoms = ["headache","fever","cough","stress","anxiety","fatigue","back pain","cold"]
for s in symptoms:
    add(f"What should I do for {s}?", f"For {s}, rest, hydration, and basic care helps. Consult a doctor if it persists.")
    add(f"Remedy for {s}", f"Basic remedies for {s} include rest and medical advice.")
    add(f"How to treat {s}", f"Treatment for {s} depends on cause. Medical consultation is recommended.")

# ================= PRODUCTIVITY =================
prod = ["focus","discipline","consistency","motivation","habits","routine","goals"]
for p in prod:
    add(f"How to improve {p}", f"You can improve {p} by planning, discipline, and daily practice.")
    add(f"Build {p}", f"{p.capitalize()} is built through consistency and structure.")
    add(f"Help me with {p}", f"I will help you improve {p} step by step.")

# ================= SCHEDULING =================
for _ in range(1500):
    h = random.randint(1,12)
    m = random.choice(["AM","PM"])
    add(f"Make a schedule for {h}{m}", f"Here is a productive schedule starting from {h}{m}.")

# ================= MATH & LOGIC =================
for _ in range(2000):
    a = random.randint(1,5000)
    b = random.randint(1,5000)
    add(f"What is {a}+{b}?", str(a+b))
    add(f"What is {a}*{b}?", str(a*b))

# ================= RANDOM KNOWLEDGE =================
topics = ["AI","robotics","space","science","technology","economics","psychology","ethics"]
for t in topics:
    add(f"Explain {t}", f"{t} is an important field of knowledge.")
    add(f"What is {t}", f"{t} is a subject of study.")

# ================= FILL UNTIL 12000 =================
while len(data) < 12000:
    w = ''.join(random.choices(string.ascii_lowercase,k=6))
    add(f"What does {w} mean?", f"{w} has no standard meaning.")

# ================= SAVE =================
with open(OUTPUT_FILE,"w",encoding="utf-8") as f:
    for i in data:
        f.write(json.dumps(i,ensure_ascii=False)+"\n")

print("✅ Intellitext AI Brain Dataset Generated")
print("Total unique samples:", len(data))