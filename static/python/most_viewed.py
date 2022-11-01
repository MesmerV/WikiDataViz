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