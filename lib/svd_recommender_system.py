import pandas as pd 
import numpy as np
import numpy.ma as ma
import math
from scipy.sparse.linalg import svds

TESTING = 0.2
TRAINING = 0.8
def main():
  ratings_df, categories_df, users_df = read_data()
  actual_df = ratings_df.pivot(index = 'UserID', columns ='CategoryID', values = 'Rating')
  
  actual_sparse = actual_df.to_numpy(dtype=np.float64)

  rmse_sgd, prediced_ratings_sgd, sgd_recall, sgd_precision = SGD(actual_sparse, users_df, categories_df)
  rmse_mean, prediced_ratings_mean, mean_recall, mean_precision = mean_corrected_ratings(actual_sparse, actual_df)
  mean_f1 = (2.0 * (mean_recall * mean_precision)) / (mean_recall + mean_precision)
  sgd_f1 = 2 * (sgd_recall * sgd_precision) / (sgd_recall + sgd_precision)
  print("Mean RMSE: " + str(rmse_mean) + " Recall: " + str(mean_recall) + " Precision: " + str(mean_precision) + " F1: " + str(mean_f1))
  print("SGD RMSE: " + str(rmse_sgd)  + " Recall: " + str(sgd_recall) + " Precision: " + str(sgd_precision) + " F1: " + str(sgd_f1))

# Function to get the rmse given the actual ratings and the predicted ratings
def get_rmse(actual, preds):
  inds = np.where(~np.isnan(actual))
  index = 0
  mse = 0
  for x in np.array(actual[inds]):
    err = x - preds[inds[0][index],inds[1][index]]
    err = err * err
    mse += err
    index = index + 1
  number_of_ratings = index
  mse /= number_of_ratings
  return np.sqrt(mse)

def read_data():
  ratings_list = [i.strip().split(",") for i in open('./../csv/ratings.csv', 'r').readlines()]
  users_list = [i.strip().split(",") for i in open('./../csv/users.csv', 'r').readlines()]
  category_list = [i.strip().split(",") for i in open('./../csv/categories.csv', 'r').readlines()]

  ratings_df = pd.DataFrame(ratings_list, columns = ['UserID', 'CategoryID', 'Rating'], dtype = int)
  categories_df = pd.DataFrame(category_list, columns = ['CategoryID', 'Name'])
  users_df = pd.DataFrame(users_list, columns = ['Index', 'UserUD'], dtype = int)
  categories_df['CategoryID'] = categories_df['CategoryID'].apply(pd.to_numeric)
  return ratings_df, categories_df, users_df

# Function finds the SVD decomposition of the actual ratings by
# replacing missing values with the mean values for that collumn
def mean_corrected_ratings(actual_sparse, actual_df):
  # https://stackoverflow.com/questions/18689235/numpy-array-replace-nan-values-with-average-of-columns
  actual_filled = np.where(np.isnan(actual_sparse), ma.array(actual_sparse, mask=np.isnan(actual_sparse)).mean(axis=0), actual_sparse) 

  U, sigma, Vt = svds(actual_filled, k = 4)
  sigma = np.diag(sigma)

  predicted_ratings = np.dot(np.dot(U, sigma), Vt) 
  predicted_df = pd.DataFrame(predicted_ratings, columns = actual_df.columns)

  predicted_np = predicted_df.to_numpy(dtype=np.float64)
  
  recall, precision = get_metrics(predicted_np, actual_sparse)
  rmse = get_rmse(actual_sparse, predicted_np)
  return rmse, predicted_np, recall, precision

def myfunction( x ):
    return sorted(x, reverse=True)

# Inspired from http://nicolas-hug.com/blog/matrix_facto_4
# Could have used tensorflow but wanted to see the underlying process
def SGD(actual_sparse, users_df, categories_df):
    users = users_df.to_numpy(dtype=np.int32)
    categories = categories_df.to_numpy()
    n_factors = 10  # number of factors
    alpha = .01  # learning rate
    n_epochs = 20  # number of iteration of the SGD procedure

    # # Randomly initialize the user and item factors.
    p = np.random.normal(0, .1, (users.shape[0], n_factors))
    q = np.random.normal(0, .1, (categories.shape[0], n_factors))

    training_length = math.floor(actual_sparse.shape[0] * TRAINING)
    testing = actual_sparse[training_length:]

    training = actual_sparse[0:training_length]
    inds = np.where(~np.isnan(training))

    for _ in range(n_epochs):
      index = 0
      for x in np.array(training[inds]):
        u = inds[0][index]
        i = inds[1][index]
        # Should use better error?
        err = x - np.dot(p[u], q[i])
        p[u] += alpha * err * q[i]
        q[i] += alpha * err * p[u]
        index += 1
    preds = np.dot(p, np.transpose(q))
    rmse = get_rmse(testing, preds)
    recall, precision = get_metrics(preds, actual_sparse)

    return rmse, preds, recall, precision

# Calculates the precision and recall from a part of the 
def get_metrics(predicted_np, actual_sparse):
  limit = 7
  limit_inds = get_indecies(actual_sparse, limit)

  rated_preds = [predicted_np[limit_inds][x:x + limit + 1] for x in range(0, len(predicted_np[limit_inds]),5)]
  rated_actual = [actual_sparse[limit_inds][x:x + limit + 1] for x in range(0, len(actual_sparse[limit_inds]),5)]
  recall_sum = 0
  recall_count = 0
  precision_sum = 0
  precision_count = 0
  for index, preds in enumerate(rated_preds):
    positives = 0
    false_positives = 0
    false_negatives = 0
    for i, pred in enumerate(preds):
      actual = rated_actual[index][i]
      predicted = pred
      if(actual > 3.5):
        if(predicted > 3.5):
          positives += 1
        else:
          false_negatives += 1
      else:
        if(predicted > 3.5):
          false_positives += 1
    recall = 'N/A'      
    if(positives + false_negatives > 0):
      recall = positives / (positives + false_negatives)
      recall_count += 1
      recall_sum += recall
    if(positives + false_positives > 0):
      precision = positives / (positives + false_positives)
      precision_count += 1
      precision_sum += precision
  recall_average = recall_sum / recall_count
  precision_average = precision_sum / precision_count
  return recall_average, precision_average
  
# Gets the first limit ratings from users
def get_indecies(actual_sparse, limit):
  inds = np.where(~np.isnan(actual_sparse))
  master_index = 0
  indecies = []
  prev_user = -1
  for user in inds[0]:
    if(prev_user != user):
      index = 0
    if(index > limit):
      indecies.append(master_index)
    index+=1
    master_index+=1
    prev_user = user
  final_users = np.delete(inds[0], indecies)
  final_items = np.delete(inds[1], indecies)
  k_inds = [final_users, final_items]
  return k_inds

if __name__ == "__main__":
  main()