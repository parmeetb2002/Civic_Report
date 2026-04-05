import os
import requests
import json
import base64
from google import genai
from urllib.error import HTTPError

def get_gemini_report(image_file):
    """
    Sends the image to the Gemini API for analysis to extract description and a severity score (1-10) using google-genai SDK.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    try:
        client = genai.Client(api_key=api_key)
        
        # Use gemini-2.0-flash as the primary stable model, with fallbacks
        models_to_try = [
            'gemini-2.5-flash',
            'gemini-2.0-flash',
            'gemini-1.5-flash',
        ]
        
        # Prepare image bytes
        if not image_file:
            return {"description": "No image data found.", "severity": 5, "error": "No image data"}

        # Reset pointer just in case and read
        image_file.seek(0)
        image_data = image_file.read()
        image_file.seek(0)

        prompt = "Analyze this image of a civic issue (pothole, broken light, garbage, etc.). Provide a JSON response with keys 'description' (short summary) and 'severity' (integer 1-10)."
        
        from google.genai import types
        
        # THE LOOP: Try models until one works or we run out
        last_error = ""
        for model_name in models_to_try:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=[
                        prompt,
                        types.Part.from_bytes(
                            data=image_data, 
                            mime_type=getattr(image_file, "content_type", "image/jpeg")
                        )
                    ],
                    config=types.GenerateContentConfig(
                        response_mime_type='application/json',
                    )
                )
                
                # Parse JSON from response
                data = json.loads(response.text)
                return {
                    "description": data.get("description", "Analyzed successfully."),
                    "severity": int(data.get("severity", 5)),
                    "model_used": model_name
                }
            except Exception as e:
                last_error = str(e)
                if "404" in last_error or "429" in last_error:
                    continue
                break

        return {
            "description": f"AI analysis unavailable. Trace: {last_error}",
            "severity": 5,
            "error": last_error
        }

    except Exception as e:
        error_msg = str(e)
        print(f"GenAI Client Error: {error_msg}")
        return {
            "description": f"Internal AI Error: {error_msg}",
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
