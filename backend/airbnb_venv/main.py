import os
import glob
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
import shap
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from catboost import Pool, CatBoostRegressor
from sklearn.metrics import mean_squared_error
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import CountVectorizer


def getRangeOfColumn(df, column_Name):
    # Auxillary function to find the range of values in the "column_name" column
    column_range = df[column_Name].max() - df[column_Name].min()

    print(f"The range of values in the 'column_name' column is: {column_range} with a min of {df[column_Name].min()} and a max of {df[column_Name].min()}")

def plotColumnDistribution(df, column_Name, description):
    
    df[column_Name].hist()

    plt.title(description)
    plt.xlabel('Value')
    plt.ylabel('Frequency')
    plt.show()

def saveCSV(df, path):
    df.to_csv(path, index=False)
    
def visualizeModel(model, X_values):
     
    shap.initjs()
    ex = shap.TreeExplainer(model)
    shap_values = ex.shap_values(X_values)
    shap.summary_plot(shap_values, X_values)

      
# set the directory path where the CSV files are located
dir_path = os.path.join(os.path.dirname(__file__), "datasets")
dir_path2 = os.path.join(os.path.dirname(__file__), "combined_datasets")


# create an empty list to hold the dataframes
dfs = []


#loop through each file in the directory
for file_name in os.listdir(dir_path):
    #if file_name.endswith(".csv"):  # check if the file is a CSV file
        file_path = os.path.join(dir_path, file_name)  # get the full file path
        df = pd.read_csv(file_path)  # read the CSV file as a dataframe

        #We need to add the city and rental period as categorical values to the csv.
        df['city'] = file_path.split('_')[0].split("/")[1]
        df['period'] = file_path.split('_')[-1].replace('.csv', '')

        #print(f" City is {city} and time period is {file_path.split('_')[-1].replace('.csv', '')}")
        dfs.append(df)  # append the dataframe to the list

''' 
for dirname,filenames in os.listdir(dir_path):
    for filename in filenames:
        file_path = os.path.join(dirname, filename)
        df_tmp = pd.read_csv(file_path)
        df_tmp['city'] = filename.split('_')[0]
        df_tmp['period'] = filename.split('_')[-1].replace('.csv', '')
        dfs.append(df_tmp)
        print(filename)
df = pd.concat(dfs, axis=0).drop(['Unnamed: 0'], axis=1).drop_duplicates()
print(df.shape)
'''

# concatenate the dataframes into a single dataframe
combined_df = pd.concat(dfs)

#dependent variable (what we want do predict)
main_label = 'realSum'

# log10-transform main label
combined_df[main_label] = combined_df[main_label].apply(lambda x: np.log10(x))

# log10-transform main label
#combined_df[main_label] = df[main_label].apply(lambda x: np.log10(x))
# bin distances on larger bins
combined_df['dist'] = combined_df['dist'].apply(lambda x: 1/2*round(2*x))
combined_df['metro_dist'] = combined_df['metro_dist'].apply(lambda x: 1/2*round(2*x))
# bin guest_satisfaction_overall rating on larger bins
combined_df['guest_satisfaction_overall'] = combined_df['guest_satisfaction_overall'].apply(lambda x: 5*round(1/5*x))
# finally, drop unused columns - they indexes seem to be some airbnb-internal metric that is not described.
cols2drop = ['Unnamed: 0', 'attr_index', 'attr_index_norm', 'rest_index', 'rest_index_norm', 'lng', 'lat', 'room_shared', 'room_private']

combined_df = combined_df.drop(cols2drop, axis=1)

combined_df.to_csv("data_cleaned.csv", index=False)

y = combined_df[main_label].values.reshape(-1,)
X = combined_df.drop([main_label], axis=1) # drop extra labels

cat_cols = X.select_dtypes(include=['object']).columns

cat_cols_idx = [list(X.columns).index(c) for c in cat_cols] 

X_train,X_test,y_train,y_test = train_test_split(X, y, test_size=0.5, random_state=83)

print(X_train.shape)
print(X_test.shape)
print(y_train.shape)
print(y_test.shape)


# initialize Pool
train_pool = Pool(X_train, 
                  y_train, 
                  cat_features=cat_cols_idx)
test_pool = Pool(X_test,
                 y_test,
                 cat_features=cat_cols_idx)

# specify the training parameters 
model = CatBoostRegressor(iterations=1000,
                          depth=5,
                          learning_rate=0.01,
                          verbose=0,
                          loss_function='RMSE')
#train the model
model.fit(train_pool)

# make the prediction using the resulting model
y_train_pred = model.predict(train_pool)
y_test_pred = model.predict(test_pool)

rmse_train = mean_squared_error(y_train, y_train_pred, squared=False)
rmse_test = mean_squared_error(y_test, y_test_pred, squared=False)
print(f"RMSE score for train {round(rmse_train,3)} dex, and for test {round(rmse_test,3)} dex")

#visualizeModel(model, X_test)

X_new_Listing = ['Private Room', 2, False, 0, 0, 8.0, 95, 1, 2, 0.5, 'amsterdam', 'weekend']

x_new = ['Entire home/apt',2.0,False,1,0,10.0,70,1,5.5,0.5, 'lisbon', 'weekdays']

y_new_pred = model.predict(x_new)

model_dir = "model"
os.makedirs(model_dir, exist_ok=True)

model.save_model(os.path.join(model_dir, "model.cbm"), format="cbm")

print(f"One night in an entire home in lisbon on a weekday would cost approximately {10**y_new_pred}")

'''
combined_df = combined_df.drop(cols2drop, axis=1)

#print(combined_df)

#combined_df.to_csv("data.csv", index=False)

encoded_df = pd.get_dummies(combined_df, columns = ["room_type", "city", "period", "room_shared", "room_private", "host_is_superhost"])

#print(encoded_df)


#input values of our model
x = encoded_df[['room_type', 'room_shared', 'room_private', 'person_capacity', 'host_is_superhost', 'multi', 'biz', 'cleanliness_rating','guest_satisfaction_overall',
                 'bedrooms', 'dist', 'metro_dist','city','period']]

#output values of our model
y = ['realSum']


x = encoded_df.drop('realSum', axis=1) # drop the target variable column
y = encoded_df['realSum']

#Splitting the dataset into train and test sets
x_train, x_test, y_train, y_test = train_test_split(x, y, test_size = 0.5)

print(x_train.shape)
print(x_test.shape)
print(y_train.shape)
print(y_test.shape)

#import model
MLR = LinearRegression()

#Import Model
model = MLR.fit(x_train, y_train)
y_predict = MLR.predict(x_test)

print(model.intercept_)


train_score = MLR.score(x_train, y_train)
test_score = MLR.score(x_test, y_test)

print(train_score, test_score)

plt.scatter(y_test, y_predict, color='#FC814A', alpha=.2)
plt.axis([0,1500,-200,1000])
plt.ylabel('Predicted Airbnb prices')
plt.xlabel('Actual Airbnb prices')
plt.title('Predicted vs Actual Airbnb prices')
plt.show()
plt.close()

'''