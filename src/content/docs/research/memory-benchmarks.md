---
title: Memory benchmarks
description: How Kiomon's retrieval performs on LongMemEval-S and LoCoMo — measured end to end, with no language model in the loop.
---

We publish retrieval numbers for the same reason we publish latency numbers: they are the part of
memory that can be measured without asking a language model to grade its own homework.

Every figure below was produced by running a benchmark's own questions against the same retrieval
Kiomon serves to you — not against a research prototype — and scoring the result against the
benchmark's own evidence labels. No answer was generated and no model judged one, so nothing here
depends on a reader we chose.

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

**They do not say** the answer is correct. Retrieval is the half that can be measured without a
judge; the half that produces an answer is measured separately, and those results are not published
yet.

**They are not a head-to-head.** Another system's recall figure is only comparable to ours when it
was measured at the same window, on the same sample, with the same rule for what counts as a hit.
Where those differ — and they often do — the two numbers describe different things, and we would
rather say so than put them side by side.

## Abstention

We do not claim that Kiomon knows when it does not know. Measured on the benchmark's 30 unanswerable
questions against 60 answerable ones, no score the retrieval layer returns separates the two groups
well enough to be a threshold: cosine similarity on the top result is 0.641 against 0.683, and
lexical coverage 0.339 against 0.529. Saying "I found nothing" needs a model that reads the context,
and today that judgement belongs to the one answering.

## How to read a recall number

Three things make a recall figure meaningful, and a figure missing any of them is not comparable:

- **the window** — recall at 20 is not recall at 10, and on a history of ~48 sessions the difference
  is most of the range;
- **the sample** — 40 questions per category is not the same measurement as 127, and ours moved
  3.2 points at rank 1 when we finished the set;
- **the floor** — a window of 20 over 48 candidates scores 42 % by chance, so 96 % and 99 % are
  closer than they look.
