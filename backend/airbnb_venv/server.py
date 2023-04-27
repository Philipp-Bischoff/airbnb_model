from typing import Union
from pydantic import BaseModel
import catboost as cb
import numpy as np
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

app = FastAPI()

origins = ["http://localhost","http://localhost:3000",]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AirbnbData(BaseModel):
    room_type: str
    person_capacity: float
    host_is_superhost: int
    multi: int
    biz: int
    cleanliness_rating: float
    guest_satisfaction_overall: int
    bedrooms: int
    dist: float
    metro_dist: float
    city: str
    period: str

model = cb.CatBoost()

model.load_model("airbnb_venv/model/model.cbm")

@app.post("/airbnb_data/")
async def receive_airbnb_data(airbnb_data: AirbnbData):

    features = np.array([
        [
            airbnb_data.room_type,
            airbnb_data.person_capacity,
            airbnb_data.host_is_superhost,
            airbnb_data.multi,
            airbnb_data.biz,
            airbnb_data.cleanliness_rating,
            airbnb_data.guest_satisfaction_overall,
            airbnb_data.bedrooms,
            airbnb_data.dist,
            airbnb_data.metro_dist,
            airbnb_data.city,
            airbnb_data.period
        ]
    ])
    prediction = model.predict(features)
    return {"prediction": prediction.tolist()}


#Example Endpoints
@app.get("/")
def read_root():

    features = np.array([['Entire home/apt', 2.0, 0, 1, 0, 10.0, 70, 1, 5.5, 0.5, 'lisbon', 'weekdays']])

    prediction = model.predict(features)

    return {"prediction": prediction.tolist()}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}