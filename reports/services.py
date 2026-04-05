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
        
        # We try multiple models in order of speed/reliability to avoid 404s/429s
        models_to_try = [
            'gemini-2.0-flash',
            'gemini-2.0-flash-exp',
            'gemini-2.5-flash',
            'gemini-1.5-flash',
            'gemini-1.5-flash-001',
            'gemini-1.5-flash-8b',
            'gemini-1.5-pro',
            'gemini-1.5-flash-latest'
        ]
        
        # Read the image bytes if provided
        image_parts = []
        if image_file:
            image_data = image_file.read()
            image_file.seek(0)
            image_parts = [
                {
                    "mime_type": getattr(image_file, "content_type", "image/jpeg"),
                    "data": image_data
                }
            ]
        
        if not image_parts:
            return {"description": "No image data found.", "severity": 5, "error": "No image data"}

        prompt = "Analyze this image of a civic issue (pothole, broken light, garbage, etc.). Provide a JSON response with keys 'description' (short summary) and 'severity' (integer 1-10)."
        generation_config = {"response_mime_type": "application/json"}

        # THE LOOP: Try models until one works or we run out
        last_error = ""
        for model_name in models_to_try:
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content([prompt, image_parts[0]], generation_config=generation_config)
                
                # Parse JSON
                data = json.loads(response.text)
                return {
                    "description": data.get("description", "Analyzed successfully."),
                    "severity": int(data.get("severity", 5)),
                    "model_used": model_name
                }
            except Exception as e:
                last_error = str(e)
                # If it's a 404 (not found) or 429 (quota), we try the next model
                if "404" in last_error or "429" in last_error:
                    print(f"Model {model_name} failed ({last_error[:20]}...). Trying next...")
                    continue
                # For other critical errors (safety, etc), we stop
                break

        return {
            "description": f"AI analysis unavailable. Last attempted error: {last_error}",
            "severity": 5,
            "error": last_error
        }

    except Exception as e:
        error_msg = str(e)
        print(f"Gemini API Critical Error: {error_msg}")
        return {
            "description": f"Critical AI Error: {error_msg}",
            "severity": 5,
            "error": error_msg
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
