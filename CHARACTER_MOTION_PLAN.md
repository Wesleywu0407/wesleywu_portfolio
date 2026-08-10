# Character Motion Direction

## Character truth

The character is calm, attentive, grounded, and slightly curious. He is not a cursor mascot and does not perform continuously for attention. His life comes from intention: he notices, decides, shifts weight, moves, settles, then resumes breathing and observing.

## Performance states

1. **Idle:** quiet breathing, tiny asymmetry in shoulders and weight, irregular blinking, occasional eye movement. No constant bobbing.
2. **Notice:** eyes lead first, then the head follows by a few frames. The torso stays grounded.
3. **Anticipate:** weight transfers onto the support leg before rotation. The free heel releases before the first step.
4. **Turn to walk:** head, shoulders, hips, and feet rotate in a believable sequence. Never flatten or flip the body as a card.
5. **Walk:** foot phase is driven by travelled distance. Planted feet do not slide.
6. **Decelerate:** stride shortens before arrival; the last foot plants before the torso settles.
7. **Turn to viewer:** eyes lead, head follows, chest opens last. The turn completes before idle resumes.
8. **Rest:** breathing returns gradually; gaze is interested but not locked onto the pointer.

## Generation rules

- Preserve the same face, navy D cap, black blazer, white T-shirt, loose dark trousers, black loafers, line work, palette, and body proportions in every frame.
- Canvas is 720 x 1280, clean white background, full body visible, one fixed floor line.
- Camera is absolutely locked: no pan, tilt, zoom, dolly, crop, reframing, scale change, or parallax.
- No extra fingers or limbs, no fused legs, no clothing changes, no facial morphing, and no moving background.
- Generate one short transition at a time. Do not ask one clip to contain the entire behaviour system.
- Use exact start and end keyframes whenever the model supports them.

## Motion system

- Scroll controls destination and travelled distance, not playback time.
- Motion uses explicit states instead of blending unrelated loops: `idle -> notice -> anticipate -> turn -> walk -> decelerate -> plant -> face-viewer -> idle`.
- A transition clip plays once. Idle and walk are separately validated seamless loops.
- Direction changes only after a planted-foot phase or an offstage reset; never mirror halfway through a step.
- Pointer gaze is a secondary layer with a small range, delayed response, and natural release. It must never float independently of the skull.
- `prefers-reduced-motion` keeps the character calm and removes travel choreography.

## Acceptance gates

A generated clip is rejected before integration if any gate fails:

- identity, costume, silhouette, or illustration style changes visibly;
- head anchor drifts more than 2 px after normalization;
- the planted foot drifts more than 3 px relative to the floor;
- body scale changes more than 1%;
- any frame crops the cap, hands, trousers, or shoes;
- the turn contains a paper-thin silhouette, body split, duplicate limb, or temporal smear;
- the first and last poses cannot match the existing idle/walk assets without a visible pop;
- motion has no readable anticipation, weight transfer, foot plant, or settle.

## Production order

1. Front idle to side-profile first step.
2. Side-profile last step to front-facing settle.
3. Refine the distance-driven walk loop.
4. Refine the breathing/attention idle loop.
5. Integrate the state machine and tune scroll thresholds on desktop.
6. Recompose and verify mobile separately.

Every stage is inspected frame by frame before the next asset is generated or wired into the site.

## Life layer — phase two

### Long living idle

- Duration: one restrained 4-second performance with the exact front pose at both ends.
- Beats: quiet inhale, slight weight transfer through hips and knees, eyes glance briefly away, attention returns, shoulders settle on the exhale.
- Hands remain in pockets. Feet remain planted. The head stays inside a very small stabilization envelope.
- This is an alternate idle, not a constant replacement. It may play only after 7–12 seconds without travel.

### Rare jacket adjustment

- One intentional action: notice the jacket, remove one hand, straighten one lapel or cuff, return the hand, settle into the exact idle pose.
- It may trigger only after 12–20 seconds without travel and has a long cooldown.
- Never run directly after the long idle, during pointer attention, during a blink, or near a scroll transition.

### Runtime behaviour

- Calm idle remains the visual default. An eligible gesture check happens only after 7–12 uninterrupted seconds, and a skipped check simply schedules another quiet interval.
- Long living idle is selected in 45% of eligible checks. Combined with the quiet interval and its short duration, the character still spends most of his time in calm idle.
- Jacket or sleeve adjustment is selected in 12% of eligible checks, only after the initial 14-second lockout and with a 30-second cooldown.
- The remaining checks intentionally do nothing. This negative space is part of the performance, not a missing animation.
- Cap adjustment remains reserved for a later pass; do not generate it until the first two additions prove visually quiet enough.
- Randomness is weighted and cooldown-based, never a repeating playlist.

### Phase-two acceptance gates

- Start and end frames match the existing front idle closely enough to enter and leave without a cross-fade.
- Both shoes remain planted during the long idle; no heel teleporting or floor drift.
- Breathing comes from chest, shoulders, and posture, not global scaling of the whole body.
- The gaze leaves and returns once; it does not track an imaginary moving target.
- A gesture is rejected if fingers merge, lapels change shape, the cap logo changes, or a hand fails to return to the pocket.

### Phase-two production record

- Front reference uploaded to Higgsfield as media `cab8ea8a-bf34-4496-9457-5b42a779b56e`.
- First living-idle generation was rejected because the mouth opened during frames 10–14. It was not integrated.
- Accepted living idle: job `c1573ad4-c268-4cee-aa8a-38b2ffe89355`; 0.17% scale drift, 0 px floor drift, no crop, closed mouth. Runtime sheet: `public/character/idle-living.png` (49 frames at 12 fps).
- Accepted jacket adjustment: job `6dd31018-5352-4ce9-a474-ca44219e5580`; 0.34% scale drift, 0 px floor drift, no crop, one hand returns cleanly to its pocket. Runtime sheet: `public/character/jacket-adjust.png` (33 frames at 8 fps).
- Phase-two Higgsfield spend: 54 credits total (one rejected test and two accepted clips).
- Runtime interruption test passed: `idleLiving -> idle -> turnOut -> walk -> turnIn -> idle`; travel always wins, but the gesture first exits through its nearest clean endpoint.

## Responsive attention — phase three

### Purpose

The third behaviour must be caused by the visitor, not added to the random idle playlist. When the pointer rests near the character, he briefly notices the person on the other side of the screen, acknowledges them, then releases his attention. This gives him perception and intention without turning him into a mascot.

### Notice performance

- Duration: 2.5–3.5 seconds, beginning and ending on the exact front idle pose.
- Eyes focus first; after a short delay the chin lifts slightly and the head turns or tilts no more than 3–5 degrees.
- One quiet inhale may open the chest by a few pixels. Hips, hands, shoes, cap, and jacket silhouette remain fixed.
- Mouth stays closed. No smile animation, wink, wave, nod loop, body bob, or exaggerated surprise.
- The return is slower than the initial notice so attention feels released rather than switched off.

### Trigger rules

- Trigger only after the pointer dwells near the character for at least 900 ms while the character is fully idle.
- Play at most once per 20 seconds and do not replay until the pointer has clearly left and returned.
- Scroll, reduced-motion, a blink, or any active gesture blocks the trigger. Scroll interruption uses the same nearest-clean-endpoint rule as phase two.
- Existing DOM pupils lead into the action; the generated clip then owns the eyes until it returns to idle.

### Acceptance gates

- Face identity, eye shape, cap logo, and closed mouth remain consistent across every frame.
- Head movement stays under the stabilisation envelope needed to prevent a visible jump at entry and exit.
- Both feet remain planted with 0–3 px permitted drift; body scale drift remains below 1%.
- First and last frames must match the accepted idle without a cross-fade.

### Phase-three production record

- Higgsfield literal generation accepted: job `3d4a2a1d-67d0-42b9-b595-6d707b7dd492` (18 credits). The unrelated “IN THE DARK” preset recommendation was explicitly declined.
- Source QA: 720×1280, 24 fps, 97 frames; 0.09% scale drift, 0 px floor drift, no crop, closed mouth, stable cap logo and pockets.
- The 5.25 px horizontal head range is intentional acting. The notice sheet therefore uses a planted-shoes anchor rather than the idle sheet's head anchor, preserving the small head response without introducing camera drift.
- Runtime sheet: `public/character/notice.png` (49 frames at 12 fps, 263 KB).
- Trigger QA passed: pointer leave-and-return plus dwell produces `idle -> notice -> idle`; a held pointer cannot re-arm the gesture, and the cooldown is 20 seconds.
- Interruption QA passed: `notice -> nearest clean endpoint -> turnOut -> walk -> turnIn -> idle`.
- Total Higgsfield spend across phases two and three: 72 credits.
