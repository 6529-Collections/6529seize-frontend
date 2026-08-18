# Museum public-site final correction

This workstream owns the 14 August 2026 corrective release for the public 6529
Network Museum. The release is governed by the live-production defect register
in the canonical Museum repository and is limited to visitor-facing Museum
content, presentation, media, responsive behavior, and exact release acceptance.

The integration branch is the only mutation lane. Parallel Luna tasks produce
bounded commits for disjoint route groups. The release captain reviews and
integrates those commits, runs the full qualification, and alone performs merge
and deployment mutations.

The decision-complete redesign and governed image programme for the Research
landing are recorded in
[`research-page-final-spec.md`](research-page-final-spec.md).

The pre-PR screenshot and adversarial-review gate is permanent repository policy:
[`museum-visual-release-acceptance.md`](../../standards/museum-visual-release-acceptance.md).
