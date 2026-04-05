import os
import requests
import json
import base64
import google.generativeai as genai
from urllib.error import HTTPError

def get_gemini_report(image_file):
    """
    Sends the image to the Gemini API for analysis to extract description and a severity score (1-10).
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    try:
        genai.configure(api_key=api_key)
        # Using the absolute most robust stable pointer for the Flash model
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        
        # Read the image bytes if provided
        image_parts = []
        if image_file:
            image_data = image_file.read()
            # Reset pointer for saving later
            image_file.seek(0)
            
            image_parts = [
                {
                    "mime_type": getattr(image_file, "content_type", "image/jpeg"),
                    "data": image_data
                }
            ]
        
        prompt = "Analyze this image of a civic issue (pothole, broken light, etc.). Provide a JSON response with keys 'description' (summary) and 'severity' (integer 1-10)."
        
        # We can enforce JSON mode for cleaner parsing
        generation_config = {
            "response_mime_type": "application/json",
        }

        if image_parts:
            response = model.generate_content([prompt, image_parts[0]], generation_config=generation_config)
        else:
            response = model.generate_content([prompt], generation_config=generation_config)

        data = json.loads(response.text)
        return {
            "description": data.get("description", "Analyzed successfully."),
            "severity": int(data.get("severity", 5))
        }
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return {
            "description": f"AI Processing Error. Please review manually. ({e})",
            "severity": 5
        }

def get_osm_poi_density(lat, lon):
    """
    Queries the Overpass API for Points of Interest (amenities, shops, etc.) within a 500m radius.
    """
    overpass_url = "http://overpass-api.de/api/interpreter"
    overpass_query = f"""
    [out:json];
    (
      node["amenity"](around:500,{lat},{lon});
      node["shop"](around:500,{lat},{lon});
    );
    out count;
    """
    try:
        response = requests.post(overpass_url, data={'data': overpass_query}, timeout=10)
        data = response.json()
        count = int(data.get('elements', [{}])[0].get('tags', {}).get('nodes', 0))
    except Exception as e:
        # Fallback to some default value if request fails
        count = 10
    
    return count

def calculate_priority(severity, density):
    """
    Calculates final priority level based on AI severity (1-10) and OSM POI density.
    """
    if density > 50:
        multiplier = 1.5
    elif density > 20:
        multiplier = 1.2
    else:
        multiplier = 1.0
        
    final_score = severity * multiplier
    
    if final_score >= 10:
        return "High"
    elif final_score >= 5:
        return "Medium"
    else:
        return "Low"
