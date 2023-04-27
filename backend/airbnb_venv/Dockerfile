FROM python:3.9

WORKDIR /airbnb_prediction/backend/

COPY ./requirements.txt /airbnb_prediction/backend/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /airbnb_prediction/backend/requirements.txt

# 
COPY ./server.py /airbnb_prediction/backend/

COPY ./model/model.cbm /airbnb_prediction/backend/airbnb_venv/model/

# 
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "80"]



