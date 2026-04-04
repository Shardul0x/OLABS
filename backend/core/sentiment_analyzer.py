from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

analyzer = SentimentIntensityAnalyzer()


def analyze_sentiment(text):
    scores = analyzer.polarity_scores(text)

    compound = scores["compound"]

    if compound >= 0.5:
        tone = "confident"
    elif compound <= -0.5:
        tone = "nervous"
    else:
        tone = "neutral"

    return {
        "tone": tone,
        "score": compound
    }