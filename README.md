# Cube Course

A seven-level speedcubing course: from a two-minute beginner solve toward sub-20 with CFOP.

Static site, no build step. Open `index.html` or serve the folder.

- `index.html` — screens, lesson text and styles
- `cube.js` — cube simulator and SVG renderer (animated turns)
- `data.js` — algorithms, the example solve and the video list
- `app.js` — router, trainer, quizzes, drills and timer
- `test.js` — `node test.js` checks every algorithm and the example solve on the simulator

Progress is saved in the browser's local storage, per device.

Deploys to Vercel on every push to `main`.
