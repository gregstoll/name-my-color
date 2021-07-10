import json
import urllib.request


def main():
    url = "https://unpkg.com/color-name-list/dist/colornames.bestof.json"
    response = urllib.request.urlopen(url)
    data = json.load(response)
    with open("public/meodairgb.txt", 'w', encoding='utf-8') as outFile:
        for entry in data:
            outFile.write(entry['name'] + " " + entry['hex'] + "\n")


if (__name__ == '__main__'):
    main()