from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
import base64
import io
from PIL import Image

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'pokemon_pixelizer')]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Define Models
class ImageRequest(BaseModel):
    image_base64: str
    
class ImageResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    original_image: str
    result_text: str
    generated_image: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PokemonHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    original_image: str
    result_text: str
    generated_image: str
    timestamp: datetime

# Routes
@api_router.get("/")
async def root():
    return {"message": "Santa Transformer API"}

@api_router.post("/pixelify", response_model=ImageResponse)
async def pixelify_image(request: ImageRequest):
    """
    Process uploaded image and convert it to pixelated Pokemon style using GPT-4o
    """
    try:
        # Validate base64 image
        if not request.image_base64:
            raise HTTPException(status_code=400, detail="No image provided")
        
        # Remove data URL prefix if present
        image_data = request.image_base64
        if 'base64,' in image_data:
            image_data = image_data.split('base64,')[1]
        
        # Validate it's a proper image
        try:
            img_bytes = base64.b64decode(image_data)
            img = Image.open(io.BytesIO(img_bytes))
            img.verify()
        except Exception as e:
            logger.error(f"Invalid image format: {e}")
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # Initialize LLM Chat with Emergent LLM Key
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="API key not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=str(uuid.uuid4()),
            system_message="You are a creative Christmas artist. Transform any character into a festive Santa version by adding Santa's iconic hat and beard while keeping the original character's features and personality."
        ).with_model("openai", "gpt-4o")
        
        # Create image content
        image_content = ImageContent(image_base64=image_data)
        
        # Create user message with image
        user_message = UserMessage(
            text="Analyze this character and describe how it would look as a Santa version. The character should keep its original appearance, body shape, and features, but add: a classic red Santa hat with white trim and pom-pom, and a fluffy white Santa beard. Describe the colors, style, and how the Santa elements blend with the character's original design. Be detailed and creative!",
            file_contents=[image_content]
        )
        
        # Get response from GPT-4o (analysis and prompt creation)
        logger.info("Sending request to GPT-4o for image analysis")
        analysis = await chat.send_message(user_message)
        logger.info(f"Received analysis: {analysis[:100]}...")
        
        # Generate image using DALL-E
        logger.info("Generating pixelated Pokemon image...")
        image_gen = OpenAIImageGeneration(api_key=api_key)
        
        # Create a focused prompt for Santa transformation
        generation_prompt = f"Transform this character into a Santa version: keep the original character exactly as it is, but add a classic red Santa hat with white fluffy trim and a white pom-pom on top, and a fluffy white Santa beard. The character should maintain its original style, colors, body shape, and personality. {analysis[:150]}. Professional illustration style, clean white background."
        
        images = await image_gen.generate_images(
            prompt=generation_prompt,
            model="gpt-image-1",
            number_of_images=1
        )
        
        if not images or len(images) == 0:
            raise HTTPException(status_code=500, detail="Failed to generate image")
        
        # Convert generated image to base64
        generated_image_base64 = base64.b64encode(images[0]).decode('utf-8')
        logger.info("Image generated successfully")
        
        # Create response object
        result = ImageResponse(
            original_image=request.image_base64,
            result_text=analysis,
            generated_image=f"data:image/png;base64,{generated_image_base64}"
        )
        
        # Store in MongoDB
        doc = result.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        await db.santa_conversions.insert_one(doc)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process image: {str(e)}")

@api_router.get("/history", response_model=List[PokemonHistory])
async def get_history():
    """
    Get the history of all pixelified images
    """
    try:
        history = await db.santa_conversions.find({}, {"_id": 0}).sort("timestamp", -1).limit(10).to_list(10)
        
        # Convert ISO string timestamps back to datetime objects
        for item in history:
            if isinstance(item['timestamp'], str):
                item['timestamp'] = datetime.fromisoformat(item['timestamp'])
        
        return history
    except Exception as e:
        logger.error(f"Error fetching history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch history")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()