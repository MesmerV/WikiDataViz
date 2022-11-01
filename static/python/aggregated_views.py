import requests
import json
from excluded_keys import excluded_keys


def top_pageviews(project, access, year, month, day):
    url = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/top/{project}/{access}/{year}/{month}/{day}'.format(
        project=project,
        access=access,
        year=year,
        month=month,
        day=day
    )
    print(url)
    headers = {'User-Agent': 'CoolBot/0.0 (https://example.org/coolbot/; coolbot@example.org)'}
    response = requests.get(url, headers=headers)
    data = response.json()
    return data['items'][0]['articles']


def refresh(pageviews, data):
    for article in pageviews:
        if article['article'] not in excluded_keys:
            if article['article'] not in data:
                data[article['article']]=article['views']
            else:
                data[article['article']]+=article['views']

def createJson(data):
    json = []
    for i, (k,v) in enumerate(data.items()):
        article = {"Article": k, "Views": v, "Rank": i+1}
        json.append(article)
    return json

with open('aggregated_views.json', 'w') as f:
    project = 'en.wikipedia.org'
    access = 'all-access'
    year = 2022
    data = {}
    for month in range (1, 11):
        if month in [1, 3, 5, 7, 8]:
            for day in range (1, 32):
                refresh(top_pageviews(project,access,year,str(month).zfill(2),str(day).zfill(2)), data)
        if month in [2]:
            for day in range (1, 29):
                refresh(top_pageviews(project,access,year,str(month).zfill(2),str(day).zfill(2)), data)
        if month in [4, 6, 9]:
            for day in range (1, 31):
                refresh(top_pageviews(project,access,year,str(month).zfill(2),str(day).zfill(2)), data)
    data = dict(list(dict(sorted(data.items(), key=lambda item: item[1], reverse=True)).items())[:100])
    data = createJson(data)
    json.dump(data, f)