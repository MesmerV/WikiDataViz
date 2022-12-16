import requests
import json
from excluded_keys import excluded_keys


def top_pageviews(project, access, agent, article, granularity, start, end):
    url = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/{project}/{access}/{agent}/{article}/{granularity}/{start}/{end}'.format(
        project=project,
        access=access,
        agent=agent,
        article=article,
        granularity=granularity,
        start=start,
        end=end
    )
    print(url)
    headers = {'User-Agent': 'CoolBot/0.0 (https://example.org/coolbot/; coolbot@example.org)'}
    response = requests.get(url, headers=headers)
    data = response.json()
    return data['items']


with open('list_views.json', 'w') as f:
    project = 'en.wikipedia.org'
    access = 'all-access'
    agent = 'all-agents'
    start = '20220101'
    end = '20221215'
    data = {}

    articles = json.load(open('static/data/aggregated_views.json'))["nodes"]
    for article in articles :
        results = top_pageviews(project,access,agent, article["Article"].replace(" ", "%20"), "daily", start, end)
        data[article['id']] = []
        for result in results:
            data[article['id']].append({"date": result['timestamp'][:-2], "views": result['views'], 'title': result['article']})
    json.dump(data, f)