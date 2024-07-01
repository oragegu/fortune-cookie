const express = require('express');
const bodyParser = require('body-parser');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Function to read quotes from CSV file
const readQuotes = () => {
    return new Promise((resolve, reject) => {
        const quotes = [];
        fs.createReadStream('quotes.csv')
          .pipe(csv())
          .on('data', (row) => {
              quotes.push({ text: row['Quote Text'], url: row['Slug'] });
          })
          .on('end', () => {
              resolve(quotes);
          })
          .on('error', reject);
    });
};

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/quote', async (req, res) => {
    try {
        const quotes = await readQuotes();
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        res.json(randomQuote);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error reading quotes.');
    }
});

app.post('/generate-image', async (req, res) => {
    try {
        const { quote } = req.body;
        const imagePath = path.join(__dirname, 'public', 'quote.png');

        // Generate image
        await sharp({
            create: {
                width: 800,
                height: 400,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 },
            },
        })
        .composite([{ 
            input: Buffer.from(`<svg width="800" height="400">
                <text x="50%" y="50%" font-size="24" fill="black" text-anchor="middle" dy=".3em">${quote}</text>
            </svg>`),
            gravity: 'center'
        }])
        .toFile(imagePath);

        res.json({ success: true, imageUrl: '/quote.png' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error generating the image.');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

