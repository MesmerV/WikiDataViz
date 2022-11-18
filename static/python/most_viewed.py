import requests
import json

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
    return data['items'][0]['articles'][:15]

if False:
    with open('top_pageviews.json', 'w') as f:
        project = 'en.wikipedia.org'
        access = 'all-access'
        year = 2022
        data = {}
        for month in range (1, 7):
            if month in [1, 3, 5]:
                for day in range (1, 32):
                    data[str(month).zfill(2)+str(day).zfill(2)] = top_pageviews(project,access,year,str(month).zfill(2),str(day).zfill(2))
            if month in [2]:
                for day in range (1, 29):
                    data[str(month).zfill(2)+str(day).zfill(2)] = top_pageviews(project,access,year,str(month).zfill(2),str(day).zfill(2))
            if month in [4, 6]:
                for day in range (1, 31):
                    data[str(month).zfill(2)+str(day).zfill(2)] = top_pageviews(project,access,year,str(month).zfill(2),str(day).zfill(2))
        json.dump(data, f)

# List top 15 most viewed articles in a given day
def top(year, month, day, n=15, project='en.wikipedia.org', access='all-access'):
    headers = {'User-Agent': 'CoolBot/0.0 (https://example.org/coolbot/; coolbot@example.org)'}
    url = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/top/{project}/{access}/{year}/{month}/{day}'.format(
        project=project,
        access=access,
        year=year,
        month=month,
        day=day
    )
    response = requests.get(url, headers=headers)
    data = response.json()
    L = [article['article'] for article in data['items'][0]['articles']]
    # replace '_' with ' '
    # L = [article.replace('_', ' ') for article in L]
    return L[:n]

# Get number of views of an bunch of articles in a given time period (start and end are in the format YYYYMMDDHHMMSS)

# returns a json file
def views_multiple(articles, start, end):
    #data = {}
    views = {}
    for i in range(len(articles)):
        article = articles[i]
        # Get the data from the API
        url = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/{}/daily/{}/{}'.format(article, start, end)
        headers = {'User-Agent': 'CoolBot/0.0 (https://example.org/coolbot/; coolbot@example.org)'}
        response = requests.get(url, headers=headers)
        #data[article] = response.json()
        if i == 0:
            list_timestamp = [item['timestamp'][:-2] for item in response.json()['items']]
        views[article] = []
        try:
            for item in response.json()['items']:
                try:
                    views[article].append(item['views'])
                except:
                    views[article].append(0) # if there is no data for that day, append 0
        except:
            pass
    result = {'timestamp': list_timestamp, 'articles': views}

    # return result
    # we convert to json like {"0101": [{"article": "Main_Page", "views": 5035302}, {"article": "Betty_White", "views": 23249}, ...]}
    # so that we can easily use it in JS already written

    rank = {article: i+1 for i, article in enumerate(articles)}
    result_json = {}
    for i in range(len(result['timestamp'])):
        result_json[result['timestamp'][i][4:]] = []
        for article in result['articles']:
            result_json[result['timestamp'][i][4:]].append({'article': article, 'views': result['articles'][article][i], 'rank': rank[article]})

    return result_json

if False:
    data = views_multiple(top(2022, '01', '15'), '20220115', '20220630')
    with open('static/data/top_15_articles_start_end.json', 'w') as f:
        json.dump(data, f)

