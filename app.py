import requests
import os
from flask import Flask, render_template
import json

app = Flask(__name__)
url = "https://dialectid.qcri.org/adi17api"


@app.route('/')
def hello_world():
    files = []
    payload = {}
    headers = {}
    def send_recieve_data(i):
        for file in os.listdir("C:/Users/youss/Downloads/voiceData"):
            files.append(
                (f"file{i}", open(
                    f"C:/Users/youss/Downloads/voiceData/{file}", 'rb'))
            )
            i += 1
        response = requests.request(
            "POST", url, headers=headers, data=payload, files=files,  verify=False)
        # print(response.text.encode('utf8'))
        data = response.text.encode('utf8').decode('utf8')
        return data
    return render_template('testing.html', context={
        "Data": send_recieve_data(1)
    })


if __name__ == '__main__':
    app.run()
