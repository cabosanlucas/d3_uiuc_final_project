import os

# enable logging
import logging
logger = logging.getLogger("workbook")

# save the starting cwd
basecwd = os.getcwd()


def create_new_dir(newDirName, projectName, projectType):
    import datetime
    import shutil

    # copy files
    os.chdir(basecwd)
    shutil.copytree("static/newDirFiles", newDirName)

    # replace project.json with accurate info
    with open( os.path.join(basecwd, newDirName, "project.json") ) as f:
        file_str = f.read()

    file_str = file_str.replace("{{TITLE}}", projectName)
    file_str = file_str.replace("{{TYPE}}", projectType)

    d = datetime.date.today()
    file_str = file_str.replace("{{INDEX}}", d.strftime("%Y%m%d"))

    with open(os.path.join(basecwd, newDirName, "project.json"), "w") as f:
        f.write(file_str)


def load_src(name, fpath):
    logger.info("-:Loading Python script:%s", fpath)

    import imp
    return imp.load_source(name, os.path.join(os.path.dirname(__file__), fpath))


def run_compute_py(dir):
    # Change the cwd to be relative to the py directory
    os.chdir(os.path.join(basecwd, dir))

    # Load/run compute.py
    logger.info("%s:Running compute.py", dir)
    load_src('dynamicPythonLoader', os.path.join(dir, 'py', 'compute.py'))
    logger.info("%s:SUCCESS in running compute.py", dir)

    # Return the cwd to the root of the workbook
    os.chdir(basecwd)


def read_project_json(dir, project_data = {}):
    import json

    project_data["dir"] = dir

    fileName = os.path.join(basecwd, dir, "project.json")
    if not os.path.isfile(fileName):
        logger.debug("%s:No project.json", dir)
        return None

    logger.debug("%s:Reading project.json", dir)
    with open(fileName) as json_file:
        json_data = json.load(json_file)

        if "title" in json_data:
            project_data["title"] = json_data["title"]

        if "index" in json_data:
        	project_data["index"] = json_data["index"]

        if "type" in json_data:
            project_data["type"] = json_data["type"]

    return project_data


def read_metadata_json(dir, metadata = {}):
    import json

    fileName = os.path.join(basecwd, dir, "metadata.json")

    if os.path.isfile(fileName) == False:
        logger.debug("%s:No metadata.json found", dir)
        return metadata

    logger.debug("%s:Reading metadata.json", dir)
    with open(fileName) as metadata_file:
        metadata = json.load(metadata_file)

    metadata["dir"] = dir
    return metadata



def construct_navigation():
    logger.debug("*:Constructing navigation...")

    # Reset the navigation global variable state
    navigation = {}
    navigation["experiences"] = []
    navigation["projects"] = []
    navigation["demos"] = []
    navigation["personal"] = []

    # Scan all of the directories
    for index, rpath in enumerate(os.listdir(basecwd)):
        path = os.path.join(basecwd, rpath)
        if os.path.isdir(path):
            project_data = {}
            project_data["dir"] = rpath

            # Attempt to infer the type of project:
            if rpath.startswith("proj_"):
                project_data["type"] = "Project"
            elif rpath.startswith("exp_"):
                project_data["type"] = "Experience"
            elif rpath.startswith("demo_"):
                project_data["type"] = "Demo"
            elif rpath.startswith("per_"):
                project_data["type"] = "Personal"
            else:
                project_data["type"] = "Unknown"

            project_data["title"] = rpath[ (rpath.find('_') + 1):: ]
            project_data["index"] = index

            # Check for the project.json
            json_file_path = os.path.join(path, "project.json")
            if os.path.isfile( json_file_path ):
                try:
                    project_data = read_project_json( rpath, project_data )
                except:
                    logger.warning("%s:Bad project.json, not adding to navigation!", rpath)
                    continue
            # If no project.json file exists, skip this directory
            else:
                logger.debug("%s:No project.json, not adding to navigation.", rpath)
                continue

            # Populate the global dictionary for templates
            if project_data["type"] == "Experience":
                navigation["experiences"].append(project_data)
            elif project_data["type"] == "Project":
                navigation["projects"].append(project_data)
            elif project_data["type"] == "Demo":
                navigation["demos"].append(project_data)
            elif project_data["type"] == "Personal":
                navigation["personal"].append(project_data)
            else:
                logger.warning("%s:Unknown project type: " + project_data["type"] + ". Not added to navigation.", rpath)
                continue

            logger.debug("%s:Added to navigation as a %s.", rpath, project_data["type"])



    return navigation
