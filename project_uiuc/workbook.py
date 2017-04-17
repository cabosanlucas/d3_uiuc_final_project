# enable logging
import workbook_logging
import logging
logger = logging.getLogger("workbook")

# helper functions
from workbook_utilities import run_compute_py, read_project_json, construct_navigation, read_metadata_json, create_new_dir

# flask
from flask import Flask, render_template, jsonify, send_file, send_from_directory, request

# core python libraries
import os
import sys
import json
import traceback

# Create the flask application object
app = Flask(__name__)

# Don't assume a template prefix name (allows for the app to serve templates
# from both templates/ and <project>/web/).
app.template_folder = '.'

# Turn on debug messages, direct them to the console
app.debug = True
app.logger.addHandler(logging.StreamHandler(sys.stdout))
app.logger.setLevel(logging.ERROR)

#
# Route the base URL to the main page
#
@app.route('/', methods=["POST"])
def home_createDir():
    logger.info("Processing index POST...")
    error = None
    success = None

    newDirName = request.form["dirName"]
    if os.path.isdir(newDirName):
        error = "Directory <b>" + newDirName + "</b> already exists!"
    else:
        create_new_dir(newDirName, request.form["projectName"], request.form["projectType"])
        success = "New directory <b>" + newDirName + "</b> created!"

    navigation = construct_navigation()
    return render_template('static/templates/mainPage.html', navigation=navigation, error=error, success=success)

@app.route('/')
def home():
    navigation = construct_navigation()
    return render_template('static/templates/mainPage.html', navigation=navigation)

#
# Files inside of /exercise/res and /exercise/web should be routed as
# static files.
#
@app.route('/<exerciseName>/res/<path:fileName>')
def fetchRes(exerciseName, fileName):
    logger.info(exerciseName + ":Sending static file: " + fileName)
    return send_from_directory(os.path.join(exerciseName, 'res'), fileName, cache_timeout=0)

@app.route('/<exerciseName>/web/<path:fileName>')
def fetchWeb(exerciseName, fileName):
    logger.info(exerciseName + ":Sending static file: " + fileName)
    return send_from_directory(os.path.join(exerciseName, 'web'), fileName, cache_timeout=0)

#
# A call to /exercise/py/ should compute (API)
#
@app.route('/<exerciseName>/py/')
def computePy(exerciseName):
    logger.info(exerciseName + ":Running compute.py")
    result = {}

    # Load and run compute.py
    try:
        run_compute_py(exerciseName)
        result["status"] = "Success"

        logger.info(exerciseName + ":compute.py ran without exception")
    except Exception as exc:
        result["status"] = "Error"
        result["error"] = str(exc)
        result["trace"] = str(traceback.format_exc())

        logger.error(exerciseName + ":compute.py generated an exception")

    return jsonify(result)

#
# Route everything else to an exercise:
#
@app.route('/<projectDir>/')
def fetchExercise(projectDir):
    logger.info(projectDir + ":Loading project")

    # Get the project info
    projectInfo = read_project_json(projectDir)
    if projectInfo == None:
        return "No project.json found."
    metadata = read_metadata_json(projectDir)

    # Figure out what to do based on the value of `show`
    show = request.args.get('show')

    showViz = False
    runPython = False

    if show == "viz":
        showViz = True
    if show == "py_viz":
        showViz = True
        runPython = True

    if runPython:
        projectInfo["ranCompute"] = True
        run_compute_py(projectDir)
    else:
        projectInfo["ranCompute"] = False


    navigation = construct_navigation()
    if showViz:
        projectInfo["showingViz"] = True
        return render_template(projectDir + '/web/index.html', project=projectInfo, navigation=navigation, metadata=metadata)
    else:
        # Project landing page
        projectInfo["showingViz"] = False
        return render_template('static/templates/projectLanding.html', project=projectInfo, navigation=navigation, metadata=metadata)

#
# Start the server with the `run` method
#
if __name__ == '__main__':
    app.run()
