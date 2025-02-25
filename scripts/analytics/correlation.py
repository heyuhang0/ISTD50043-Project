from pyspark.sql import SparkSession
from pyspark.sql.functions import length
from pyspark.sql.types import StructType, StructField, StringType
import math

hdfs_dir = 'hdfs://com.example.name-node:9000/DBProject/'
session = SparkSession.builder.appName("correlation").getOrCreate()
sc = session.sparkContext

schema = StructType([
    StructField("reviewId", StringType(), True),
    StructField("asin", StringType(), True),
    StructField("reviewerId", StringType(), True),
    StructField("helpful", StringType(), True),
    StructField("rating", StringType(), True),
    StructField("summary", StringType(), True),
    StructField("reviewText", StringType(), True),
    StructField("createdAt", StringType(), True),
    StructField("updatedAt", StringType(), True)])

reviews_df = session.read.csv(hdfs_dir + "review.csv", header=False, sep="\t", schema=schema)

# select needed columns for computing correlation
# get the length of each review
reviews = reviews_df.select("reviewId", "asin", "reviewText")
reviews = reviews.withColumn("reviewLength", length(reviews.reviewText))

# group reviews by asin and get average review length
reviews_average = reviews.groupBy("asin").agg({'reviewLength': "mean"})

# get the metadata from books.json
books_df = session.read.json(hdfs_dir + "books.json")

# drop those books with negative price values
books_filtered = books_df.filter(books_df.price > 0)
books = books_filtered.select("asin", "price")

# join reviews and books by asin
combined_df = reviews_average.join(books, ["asin"])
n = combined_df.count()
combined_df.show(1)

# map reviewLength and price to all components needed to calculate pearson correlation
# structure after flatmap: 
# [
#    ("x", float), ("x_square", float), ("y", float), ("y_square", float), ("xy", float), 
#    ("x", float), ("x_square", float), ("y", float), ("y_square", float), ("xy", float),
#    ... ..., 
#    ("x", float), ("x_square", float), ("y", float), ("y_square", float), ("xy", float)
# ]
flatdata = combined_df.rdd\
    .map(list)\
    .flatMap(lambda book_row: (
        ("x", book_row[1]),
        ("x_squared", book_row[1] * book_row[1]),
        ("y", book_row[2]),
        ("y_squared", book_row[2] * book_row[2]),
        ("xy", book_row[1] * book_row[2])
    ))

# get the summation of the terms in flatdata
# structure after reduce: [("x", float), ("x_square", float), ("y", float), ("y_square", float), ("xy", float)]
reduced_data = flatdata.reduceByKey(lambda x, y: x+y)

y_squared = reduced_data.lookup('y_squared')[0]
x_squared = reduced_data.lookup('x_squared')[0]
xy = reduced_data.lookup('xy')[0]
y = reduced_data.lookup('y')[0]
x = reduced_data.lookup('x')[0]

# calculate correlation
correlation = (n * xy - x*y) / math.sqrt(n * x_squared - x*x) / math.sqrt(n * y_squared - y*y)

output = sc.parallelize(['correlation', correlation])
output.coalesce(1, True).saveAsTextFile(hdfs_dir + "correlation_output")

session.stop()