from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from pathlib import Path
import os
import sqlite3
import logging
import json


def setup_db_path():
    """Setup database path relative to comparator directory (execution context)."""
    # Get database name from environment variable
    db_name = os.getenv('DB_NAME')
    if not db_name:
        raise EnvironmentError("DB_NAME not set in environment variables")
        
    base_path = Path.cwd()  # Gets the current working directory (comparator)
    db_path = base_path / db_name
    
    # Ensure the directory exists
    db_path.parent.mkdir(parents=True, exist_ok=True)
    
    return str(db_path)


# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

# CORS configuration
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS').split(',')
CORS(app, resources={r"/*": {"origins": ALLOWED_ORIGINS}})

# Set up logging
logging.basicConfig(level=os.getenv('LOG_LEVEL', 'INFO'))
logger = logging.getLogger(__name__)

# DB_PATH = os.getenv('DB_PATH')
# Set up the database path
DB_PATH = setup_db_path()


def extract_code_analysis_metadata(code_analysis_str):
    try:
        # Parse the JSON string into a Python dictionary
        code_analysis = json.loads(code_analysis_str)
    except json.JSONDecodeError:
        # If it's not valid JSON, try evaluating it as a Python literal
        try:
            code_analysis = eval(code_analysis_str)
        except:
            return {"error": "Failed to parse CODE_ANALYSIS data"}

    # Extract metadata from each issue
    metadata_list = []
    for issue_type, data in code_analysis.items():
        metadata = data.get('metadata', {})
        metadata['issue_type'] = issue_type  # Add issue type to metadata
        metadata_list.append(metadata)

    return metadata_list

@app.route('/', methods=['GET'])
def root():
    logger.info("Root endpoint accessed")
    return "Welcome to the Android Analysis Tool API"

@app.route('/app-details', methods=['GET'])
def handle_get_app_details():
    logger.info("Accessing app-details endpoint")
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT APP_NAME, PACKAGE_NAME, VERSION_NAME FROM StaticAnalyzer_staticanalyzerandroid")
        rows = cursor.fetchall()
        conn.close()

        response_array = [{'APP_NAME': row[0], 'PACKAGE_NAME': row[1], 'VERSION_NAME': row[2]} for row in rows]
        logger.debug(f"Returning {len(response_array)} app details")
        return jsonify(response_array)
    except sqlite3.Error as e:
        logger.error(f"Database error in app-details: {str(e)}")
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@app.route('/accept-package-name', methods=['POST'])
def handle_post_accept_package_name():
    logger.info("Accessing accept-package-name endpoint")
    try:
        data = request.json
        if not data or 'packageName' not in data:
            logger.warning("Invalid JSON received in accept-package-name")
            return jsonify({'error': 'Invalid JSON'}), 400

        package_name = data['packageName']
        logger.debug(f"Package name received: {package_name}")
        query = """
        SELECT CODE_ANALYSIS, APP_NAME, DOMAINS, SIZE, SHA256, PACKAGE_NAME, PERMISSIONS,
               VERSION_NAME, MALWARE_PERMISSIONS, TRACKERS, NETWORK_SECURITY, EXPORTED_COUNT
        FROM StaticAnalyzer_staticanalyzerandroid
        WHERE PACKAGE_NAME = ?
        """

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(query, (package_name,))
        rows = cursor.fetchall()
        conn.close()

        response_array = []
        for row in rows:
            row_dict = dict(zip([column[0] for column in cursor.description], row))
            
            # Process CODE_ANALYSIS to extract metadata
            if 'CODE_ANALYSIS' in row_dict:
                row_dict['CODE_ANALYSIS_METADATA'] = extract_code_analysis_metadata(row_dict['CODE_ANALYSIS'])
                del row_dict['CODE_ANALYSIS']  # Remove the original CODE_ANALYSIS field
            
            response_array.append(row_dict)

        logger.debug(f"Returning data for {len(response_array)} packages")
        return jsonify(response_array)
    except sqlite3.Error as e:
        logger.error(f"Database error in accept-package-name: {str(e)}")
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    except Exception as e:
        logger.error(f"Error in accept-package-name: {str(e)}")
        return jsonify({'error': f'Error: {str(e)}'}), 400

@app.route('/compare-apps', methods=['POST'])
def handle_post_compare_apps():
    logger.info("Accessing compare-apps endpoint")
    try:
        data = request.json
        if not data or 'packageName' not in data or not isinstance(data['packageName'], list) or len(data['packageName']) != 2:
            logger.warning("Invalid request received in compare-apps")
            return jsonify({'error': 'Invalid request. Please provide exactly two package names.'}), 400

        package_name1, package_name2 = data['packageName']
        logger.debug(f"Comparing packages: {package_name1} and {package_name2}")
        query = """
        SELECT APP_NAME, SIZE, SHA256, PACKAGE_NAME, PERMISSIONS, VERSION_NAME,
               MALWARE_PERMISSIONS, TRACKERS, NETWORK_SECURITY, EXPORTED_COUNT, CODE_ANALYSIS
        FROM StaticAnalyzer_staticanalyzerandroid
        WHERE PACKAGE_NAME IN (?, ?)
        """

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(query, (package_name1, package_name2))
        rows = cursor.fetchall()
        conn.close()

        response_array = []
        for row in rows:
            row_dict = dict(zip([column[0] for column in cursor.description], row))
            
            # Process CODE_ANALYSIS to extract metadata
            if 'CODE_ANALYSIS' in row_dict:
                row_dict['CODE_ANALYSIS_METADATA'] = extract_code_analysis_metadata(row_dict['CODE_ANALYSIS'])
                del row_dict['CODE_ANALYSIS']  # Remove the original CODE_ANALYSIS field
            
            response_array.append(row_dict)

        logger.debug(f"Returning comparison data for {len(response_array)} apps")
        return jsonify(response_array)
    except sqlite3.Error as e:
        logger.error(f"Database error in compare-apps: {str(e)}")
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    except Exception as e:
        logger.error(f"Error in compare-apps: {str(e)}")
        return jsonify({'error': f'Error: {str(e)}'}), 400
    
@app.route('/compare-apps-versions', methods=['POST'])
def handle_post_compare_apps_versions():
    logger.info("Accessing compare-apps-versions endpoint")
    try:
        data = request.json
        if not data or 'packageName1' not in data or 'version1' not in data or 'packageName2' not in data or 'version2' not in data:
            logger.warning("Invalid request received in compare-apps-versions")
            return jsonify({'error': 'Invalid request. Please provide two package names and their versions.'}), 400

        package_name1 = data['packageName1']
        version1 = data['version1']
        package_name2 = data['packageName2']
        version2 = data['version2']

        logger.debug(f"Comparing apps: {package_name1} (v{version1}) and {package_name2} (v{version2})")
        
        query = """
        SELECT APP_NAME, SIZE, SHA256, PACKAGE_NAME, PERMISSIONS, VERSION_NAME,
               MALWARE_PERMISSIONS, DOMAINS, TRACKERS, NETWORK_SECURITY, EXPORTED_COUNT, CODE_ANALYSIS
        FROM StaticAnalyzer_staticanalyzerandroid
        WHERE (PACKAGE_NAME = ? AND VERSION_NAME = ?) OR (PACKAGE_NAME = ? AND VERSION_NAME = ?)
        """

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(query, (package_name1, version1, package_name2, version2))
        rows = cursor.fetchall()
        conn.close()

        response_array = []
        for row in rows:
            row_dict = dict(zip([column[0] for column in cursor.description], row))
            
            if 'CODE_ANALYSIS' in row_dict:
                row_dict['CODE_ANALYSIS_METADATA'] = extract_code_analysis_metadata(row_dict['CODE_ANALYSIS'])
                del row_dict['CODE_ANALYSIS']
            
            response_array.append(row_dict)

        # Ensure the order matches the input order
        ordered_response = sorted(response_array, key=lambda x: (
            x['PACKAGE_NAME'] == package_name1 and x['VERSION_NAME'] == version1,
            x['PACKAGE_NAME'] == package_name2 and x['VERSION_NAME'] == version2
        ), reverse=True)

        logger.debug(f"Returning comparison data for {len(ordered_response)} apps")
        return jsonify(ordered_response)
    except sqlite3.Error as e:
        logger.error(f"Database error in compare-apps-versions: {str(e)}")
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    except Exception as e:
        logger.error(f"Error in compare-apps-versions: {str(e)}")
        return jsonify({'error': f'Error: {str(e)}'}), 400
    
    
if __name__ == '__main__':
    logger.info(f"Starting the server with database at: {DB_PATH}")
    app.run(
        host=os.getenv('HOST', '0.0.0.0'),
        port=int(os.getenv('PORT', 8080)),
        debug=os.getenv('DEBUG', 'False').lower() == 'true'
    )