var express = require('express');
var router = express.Router({ mergeParams: true });

var mockReviews = [
  {
    "": 0,
    "asin": "B000F83SZQ",
    "helpful": [
      0,
      0
    ],
    "overall": 5,
    "reviewText": "I enjoy vintage books and movies so I enjoyed reading this book.  The plot was unusual.  Don't think killing someone in self-defense but leaving the scene and the body without notifying the police or hitting someone in the jaw to knock them out would wash today.Still it was a good read for me.",
    "reviewTime": "05 5, 2014",
    "reviewerID": "A1F6404F1VG29J",
    "reviewerName": "Avidreader",
    "summary": "Nice vintage story",
    "unixReviewTime": 1399248000
  },
  {
    "": 1,
    "asin": "B000F83SZQ",
    "helpful": [
      2,
      2
    ],
    "overall": 4,
    "reviewText": "This book is a reissue of an old one; the author was born in 1910. It's of the era of, say, Nero Wolfe. The introduction was quite interesting, explaining who the author was and why he's been forgotten; I'd never heard of him.The language is a little dated at times, like calling a gun a &#34;heater.&#34;  I also made good use of my Fire's dictionary to look up words like &#34;deshabille&#34; and &#34;Canarsie.&#34; Still, it was well worth a look-see.",
    "reviewTime": "01 6, 2014",
    "reviewerID": "AN0N05A9LIJEQ",
    "reviewerName": "critters",
    "summary": "Different...",
    "unixReviewTime": 1388966400
  },
  {
    "": 2,
    "asin": "B000F83SZQ",
    "helpful": [
      2,
      2
    ],
    "overall": 4,
    "reviewText": "This was a fairly interesting read.  It had old- style terminology.I was glad to get  to read a story that doesn't have coarse, crasslanguage.  I read for fun and relaxation......I like the free ebooksbecause I can check out a writer and decide if they are intriguing,innovative, and have enough of the command of Englishthat they can convey the story without crude language.",
    "reviewTime": "04 4, 2014",
    "reviewerID": "A795DMNCJILA6",
    "reviewerName": "dot",
    "summary": "Oldie",
    "unixReviewTime": 1396569600
  },
  {
    "": 3,
    "asin": "B000F83SZQ",
    "helpful": [
      1,
      1
    ],
    "overall": 5,
    "reviewText": "I'd never read any of the Amy Brewster mysteries until this one..  So I am really hooked on them now.",
    "reviewTime": "02 19, 2014",
    "reviewerID": "A1FV0SX13TWVXQ",
    "reviewerName": "Elaine H. Turley \"Montana Songbird",
    "summary": "I really liked it.",
    "unixReviewTime": 1392768000
  },
  {
    "": 4,
    "asin": "B000F83SZQ",
    "helpful": [
      0,
      1
    ],
    "overall": 4,
    "reviewText": "If you like period pieces - clothing, lingo, you will enjoy this mystery.  Author had me guessing at least 2/3 of the way through.",
    "reviewTime": "03 19, 2014",
    "reviewerID": "A3SPTOKDG7WBLN",
    "reviewerName": "Father Dowling Fan",
    "summary": "Period Mystery",
    "unixReviewTime": 1395187200
  },
  {
    "": 5,
    "asin": "B000F83SZQ",
    "helpful": [
      0,
      0
    ],
    "overall": 4,
    "reviewText": "A beautiful in-depth character description makes it like a fast pacing movie. It is a pity Mr Merwin did not write 30 instead only 3 of the Amy Brewster mysteries.",
    "reviewTime": "05 26, 2014",
    "reviewerID": "A1RK2OCZDSGC6R",
    "reviewerName": "ubavka seirovska",
    "summary": "Review",
    "unixReviewTime": 1401062400
  },
  {
    "": 6,
    "asin": "B000F83SZQ",
    "helpful": [
      0,
      0
    ],
    "overall": 4,
    "reviewText": "I enjoyed this one tho I'm not sure why it's called An Amy Brewster Mystery as she's not in it very much. It was clean, well written and the characters well drawn.",
    "reviewTime": "06 10, 2014",
    "reviewerID": "A2HSAKHC3IBRE6",
    "reviewerName": "Wolfmist",
    "summary": "Nice old fashioned story",
    "unixReviewTime": 1402358400
  },
  {
    "": 7,
    "asin": "B000F83SZQ",
    "helpful": [
      1,
      1
    ],
    "overall": 4,
    "reviewText": "Never heard of Amy Brewster. But I don't need to like Amy Brewster to like this book. Actually, Amy Brewster is a side kick in this story, who added mystery to the story not the one resolved it. The story brings back the old times, simple life, simple people and straight relationships.",
    "reviewTime": "03 22, 2014",
    "reviewerID": "A3DE6XGZ2EPADS",
    "reviewerName": "WPY",
    "summary": "Enjoyable reading and reminding the old times",
    "unixReviewTime": 1395446400
  },
  {
    "": 8,
    "asin": "B000FA64PA",
    "helpful": [
      0,
      0
    ],
    "overall": 5,
    "reviewText": "Darth Maul working under cloak of darkness committing sabotage now that is a story worth reading many times over.  Great story.",
    "reviewTime": "10 11, 2013",
    "reviewerID": "A1UG4Q4D3OAH3A",
    "reviewerName": "dsa",
    "summary": "Darth Maul",
    "unixReviewTime": 1381449600
  },
  {
    "": 9,
    "asin": "B000FA64PA",
    "helpful": [
      0,
      0
    ],
    "overall": 4,
    "reviewText": "This is a short story focused on Darth Maul's role in helping the Trade Federation gain a mining colony. It's not bad, but it's also nothing exceptional. It's fairly short so we don't really get to see any characters develop. The few events that do happen seem to go by quickly, including what should have been major battles. The story is included in the novelShadow Hunter (Star Wars: Darth Maul), which is worth reading, so don't bother to buy this one separately.",
    "reviewTime": "02 13, 2011",
    "reviewerID": "AQZH7YTWQPOBE",
    "reviewerName": "Enjolras",
    "summary": "Not bad, not exceptional",
    "unixReviewTime": 1297555200
  },
  {
    "": 10,
    "asin": "B000FA64PA",
    "helpful": [
      0,
      0
    ],
    "overall": 5,
    "reviewText": "I think I have this one in both book and audio. It is a good story either way. good ol' Maul.",
    "reviewTime": "01 27, 2014",
    "reviewerID": "A1ZT7WV0ZUA0OJ",
    "reviewerName": "Mike",
    "summary": "Audio and book",
    "unixReviewTime": 1390780800
  }
];

router.get('/', function (req, res, next) {
  let bookASIN = req.params.asin;
  let limit = req.query.limit || 20;
  let offset = req.query.offset || 0;
  console.log('Getting reviews',
    'for book ASIN=' + bookASIN,
    'with limit=' + limit,
    'and offset=' + offset);

  res.json(mockReviews);
});

router.post('/', function (req, res, next) {
  let bookASIN = req.params.asin;
  console.log('Posting review for book ASIN=' + bookASIN);

  res.json({ message: "success" });
});

module.exports = router;
