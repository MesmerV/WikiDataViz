from flask import Flask, flash, redirect, render_template, request, session, abort,send_from_directory,send_file,jsonify
import pandas as pd
import csv
import json



# Declare application
app= Flask(__name__)

#Define main code
@app.route("/get-data")
def returnData(): 
    with open('static/data/top_pageviews.json') as json_file:
        data = json.load(json_file)
        return jsonify(data)

if __name__ == "__main__":
    app.run(debug=True, port=5500)
