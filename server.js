import express from 'express';
import fs from "fs/promises";
const app = express();

// Serve the static files from the Svelte app
app.use(express.static('dist'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/scores", async (req, res) => {
    let scores = JSON.parse(await fs.readFile("scores.json", "utf-8"));
    scores = Object.entries(scores)
        .sort(([,a],[,b]) => b-a)
        .slice(0, 10)
        .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
    res.json(scores);
});

// query params: user, score
app.get("/scores/add", async (req, res) => {
    console.log(req.query.user, req.query.score);
    const scores = JSON.parse(await fs.readFile("scores.json", "utf-8"));
    scores[req.query.user] = Number.parseInt(req.query.score) || 0;
    res.json(scores);
    fs.writeFile("scores.json", JSON.stringify(scores), "utf-8");
});

// Port CAN NOT be 3000 because that's already in use by Svelte dev server
const port = process.env.PORT || 3030;
app.listen(port);

console.log("App is listening on port " + port);
