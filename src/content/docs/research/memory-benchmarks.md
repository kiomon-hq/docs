---
title: Memory benchmarks
description: How Kiomon's retrieval and its answers perform on LongMemEval-S and LoCoMo — with the sample, the window and the judge stated.
---

We publish retrieval numbers for the same reason we publish latency numbers: they are the part of
memory that can be measured without asking a language model to grade its own homework.

Every figure below was produced by running a benchmark's own questions against the same retrieval
Kiomon serves to you — not against a research prototype — and scoring the result against the
benchmark's own labels. There are two measurements, and they answer different questions: whether
the evidence came back, and whether the answer did. The retrieval figures involve no model at all.
The answer figures do, and they name the reader and the judge, because a score that hides either is
not comparable to anything.

## LongMemEval-S

500 questions, each with about 48 sessions of chat history behind it and roughly 115,000 tokens of
context. The scored metric is whether the session containing the answer is among the top *k*
results.

| Category | n | top 1 | top 5 | top 10 | top 20 |
|---|---|---|---|---|---|
| single-session · user | 64 | 82.8 % | 95.3 % | 95.3 % | 96.9 % |
| single-session · assistant | 56 | 100 % | 100 % | 100 % | 100 % |
| single-session · preference | 30 | 66.7 % | 93.3 % | 96.7 % | 96.7 % |
| temporal reasoning | 127 | 85.0 % | 93.7 % | 97.6 % | 99.2 % |
| knowledge update | 72 | 97.2 % | 100 % | 100 % | 100 % |
| multi-session | 121 | 85.1 % | 99.2 % | 99.2 % | 100 % |
| **All** | **470** | **87.2 %** | **97.0 %** | **98.3 %** | **99.1 %** |
| *random window of 20* | | | | | *42.2 %* |

All 470 scored questions were run. The set's other 30 are abstention questions — "what is my
hamster's name?" when the history only ever mentions a cat — so there is no answer to locate; only a
metric that judges the generated answer can score those. 95 % confidence intervals: top 20
[97.8, 99.7], top 1 [83.9, 90.0].

**The 42.2 % row is part of the result.** A history here holds about 48 sessions, so a window of 20
already covers 42 % of the candidates by chance. Recall@20 is a weak metric on this benchmark; we
report it because it is the number systems publish, and we report top-1 because it is the one that
separates them.

### Answers

Finding the evidence is not the same as using it. For the answer half the benchmark's questions are
put to a reader model together with the retrieved history, and a second model judges each answer
against the reference using the benchmark's own question-specific prompts, unchanged.

| Category | n | answered correctly |
|---|---|---|
| single-session · assistant | 56 | 100 % |
| knowledge update | 72 | 94.4 % |
| single-session · preference | 30 | 93.3 % |
| single-session · user | 64 | 92.2 % |
| temporal reasoning | 127 | 86.6 % |
| multi-session | 121 | 84.3 % |
| **All answerable** | **470** | **90.0 %** |

The 95 % confidence interval on that headline is [87.0, 92.4]. Scored across all 500 questions —
including the 30 that have no answer to find — it is 89.2 %.

The reader was GPT-6 Luna and the judge DeepSeek V4.1 Flash, a different model family, so no model
grades its own answers. Each question was given the ten retrieved sessions, about 32,000 tokens of
context, and the whole run cost $1.84.

The weakest categories are the two whose evidence is spread across conversations — multi-session at
84.3 % and temporal reasoning at 86.6 %. Those are the places where finding one session is not
enough, and they are where the next work is.

## LoCoMo

Ten long conversations, 1,986 questions, about 600 turns each. Here the benchmark's evidence is a
single **turn**, not a session — a harder question — so both are reported:

| Category | n | evidence turn in top 20 | evidence session in top 20 |
|---|---|---|---|
| multi-hop | 282 | 78.7 % | 96.5 % |
| temporal | 321 | 80.4 % | 96.3 % |
| open-domain | 96 | 55.2 % | 83.3 % |
| single-hop | 841 | 79.4 % | 97.6 % |
| adversarial | 446 | 60.8 % | 96.2 % |
| **All** | **1,986** | **74.1 %** | **96.2 %** |
| *random window of 20* | | *3.4 %* | *3.4 %* |

At a window of ten the same run gives 67.0 % for the evidence turn and 92.6 % for the evidence
session, against a 1.7 % floor.

Our weakest category is open-domain at 55.2 %: those questions need world knowledge the history does
not contain. Retrieval does not fix that, and we do not claim it does.

## What these numbers do and do not say

**They do say** the right session or turn comes back. On LongMemEval the evidence session is the
first result for 87 % of questions; on LoCoMo the exact turn is in the top 20 twenty-two times more
often than chance.

**They do not say** the answer is correct — that is a separate measurement, reported above with its
reader and its judge named. A judged score quotes its judge: ours is one model, and a second judge on
the same run is still outstanding.

**They are not a head-to-head.** Another system's recall figure is only comparable to ours when it
was measured at the same window, on the same sample, with the same rule for what counts as a hit.
Where those differ — and they often do — the two numbers describe different things, and we would
rather say so than put them side by side.

## Abstention

The retrieval layer does not know when there is nothing to find, and we do not claim it does.
Measured on the benchmark's 30 unanswerable questions against 60 answerable ones, no score it returns
separates the two groups well enough to be a threshold: cosine similarity on the top result is 0.641
against 0.683, and lexical coverage 0.339 against 0.529.

The answering model does better: it identified 76.7 % of those 30 questions as unanswerable. That is a
property of the reader rather than of search — it moves when the reader changes, and it is the one
number on this page that depends on a model recognising its own ignorance.

## How to read these numbers

Three things make a recall figure meaningful, and a figure missing any of them is not comparable:

- **the window** — recall at 20 is not recall at 10, and on a history of ~48 sessions the difference
  is most of the range;
- **the sample** — 40 questions per category is not the same measurement as 127, and ours moved
  3.2 points at rank 1 when we finished the set;
- **the floor** — a window of 20 over 48 candidates scores 42 % by chance, so 96 % and 99 % are
  closer than they look.

An answer figure needs one more: **the reader and the judge**. An accuracy number without both is
unfalsifiable, which is why every one here carries them.
