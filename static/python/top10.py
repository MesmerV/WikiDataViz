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

def metadata(article):
    url = "https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=pageimages|pageterms&piprop=thumbnail&pithumbsize=100&titles={article}&pilicense=any".format(
        article=article,
    )
    print(url)
    headers = {'User-Agent': 'CoolBot/0.0 (https://example.org/coolbot/; coolbot@example.org)'}
    response = requests.get(url, headers=headers)
    data = response.json()
    try: 
        return {"id": list(data['query']['pages'])[0]['pageid'], "thumbnail": list(data['query']['pages'])[0]['thumbnail']['source'], "description":list(data['query']['pages'])[0]['terms']['description']}
    except:
        return {"id": "", "thumbnail": "", "description": ""}

def getNodes(data):
    json = []
    for datum in data:
        print(datum)
        m = metadata(datum['article'])
        article = {"id": m["id"], "Article": datum['article'].replace("_", " "), "Views": datum['views'], "Rank": datum['rank'], "Thumbnail":m["thumbnail"], "Description": m["description"]}
        json.append(article)
    return json

def getLinks(data):
    json = []
    for article in data:
        title = article['Article'].replace(" ", "%20")
        url = 'https://en.wikipedia.org/w/api.php?action=query&generator=links&titles={title}&prop=pageprops&ppprop=wikibase_item&gpllimit=500&format=json'.format(
            title=title
        )
        print(url)
        headers = {'User-Agent': 'CoolBot/0.0 (https://example.org/coolbot/; coolbot@example.org)'}
        response = requests.get(url, headers=headers)
        results = response.json()
        for result in results['query']['pages']:
            if result != -1 :
                for subarticle in data:
                    if subarticle['id'] == int(result):
                        json.append({'source':article['id'], 'target':subarticle['id']})
    return json

with open('top10.json', 'w') as f:
    project = 'en.wikipedia.org'
    access = 'all-access'
    year = 2022
    data = {}
    for month in range (1, 13):
        if month in [1, 3, 5, 7, 8, 10]:
            for day in range (1, 32):
                data["{:02d}".format(day)+"{:02d}".format(month)] = getNodes(top_pageviews(project,access,year,str(month).zfill(2),str(day).zfill(2))[:12])
        if month in [2]:
            for day in range (1, 29):
                data["{:02d}".format(day)+"{:02d}".format(month)] = getNodes(top_pageviews(project,access,year,str(month).zfill(2),str(day).zfill(2))[:12])
        if month in [4, 6, 9, 11]:
            for day in range (1, 31):
                data["{:02d}".format(day)+"{:02d}".format(month)] = getNodes(top_pageviews(project,access,year,str(month).zfill(2),str(day).zfill(2))[:12])
        if month in [12]:
            for day in range (1, 15):
                data["{:02d}".format(day)+"{:02d}".format(month)] = getNodes(top_pageviews(project,access,year,str(month).zfill(2),str(day).zfill(2))[:12])
    json.dump(data, f)