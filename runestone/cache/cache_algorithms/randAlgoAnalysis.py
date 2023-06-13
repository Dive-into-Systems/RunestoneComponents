import os
import pandas as pd

from randomAds import main_random
from hitNmiss import main_hitNmiss
from boost import main_boost
from uniqueBound import main_bound
from randAlgoStats import RandAlgo, toBinary

timeStamp_now = str(pd.Timestamp.now())
dir_name = "./Algorithm Test Result " + timeStamp_now

file_table_name = dir_name + "/result " + timeStamp_now + ".csv"

os.mkdir(dir_name)
tag_bit_iterates = [1,2,3,4]
index_bit_iterates = [1,2]
offset_bit_iterates = [2]
ads_num_iterates = [4, 8]
algorithm_iterates = [main_random, main_hitNmiss, main_boost]


randomAdsSet  = {
    'Tag Bits': [],
    'Index Bits': [],
    'Offset Bits': [],
    'Number of Addresses': [],
    'Algorithm Name': [],
    'Cold Start Miss': [],
    'Conflict Miss': [],
    'Hit/Miss Ratio':[],
    'Indices Coverage':[],
    'Address Variety':[],
}

for tag_bits in tag_bit_iterates:
    print("start: tag " + str(tag_bits))
    for index_bits in index_bit_iterates:
        print("start: index " + str(index_bits))
        for offset_bits in offset_bit_iterates:
            print("start: offset " + str(offset_bits))
            for ads_num in ads_num_iterates:
                print(ads_num)
                for fn in algorithm_iterates:
                    for i in range(100):
                        currAlgo = fn(ads_num, offset_bits, index_bits, tag_bits)
                        randomAdsSet['Tag Bits'].append(tag_bits)
                        randomAdsSet['Index Bits'].append(index_bits)
                        randomAdsSet['Offset Bits'].append(offset_bits)
                        randomAdsSet['Number of Addresses'].append(ads_num)
                        randomAdsSet['Algorithm Name'].append(currAlgo.name)
                        randomAdsSet['Cold Start Miss'].append(currAlgo.cold_start_miss)
                        randomAdsSet['Conflict Miss'].append(currAlgo.conflict_miss)
                        randomAdsSet['Hit/Miss Ratio'].append(currAlgo.hit_miss_ratio)
                        randomAdsSet['Indices Coverage'].append(currAlgo.indices_coverage)
                        randomAdsSet['Address Variety'].append(currAlgo.address_variety)
            
randAdsDF = pd.DataFrame(randomAdsSet)

randAdsDF.to_csv(file_table_name, index=False)

# all across algorithm
file_acrossAlgo_name = dir_name + "/across algorithms analysis" + timeStamp_now + ".csv"
file_acrossAlgo_plot = dir_name + "/across algorithms analysis" + timeStamp_now + ".pdf"

algoCompare = {
    "Algorithm Name" : [],
    "Cold Start Miss avg" : [],
    "Cold Start Miss sd" : [],
    "Conflict Miss avg" : [],
    "Conflict Miss sd" : [],
    'Hit/Miss Ratio avg' : [],
    'Hit/Miss Ratio sd' : [],
    'Indices Coverage avg' : [],
    'Indices Coverage sd' : [],
    'Address Variety avg' : [],
    'Address Variety sd' : [],
}

algorithm_name_iterates = ["rand", "hitNmiss", "boost"]
for algorithm_name in algorithm_name_iterates:
    algoCompare["Algorithm Name"].append(algorithm_name)
    currAlgo_df = randAdsDF[randAdsDF['Algorithm Name'] == algorithm_name]
    algoCompare["Cold Start Miss avg"].append(currAlgo_df["Cold Start Miss"].mean())
    algoCompare["Cold Start Miss sd"].append(currAlgo_df["Cold Start Miss"].std())
    algoCompare["Conflict Miss avg"].append(currAlgo_df['Conflict Miss'].mean())
    algoCompare["Conflict Miss sd"].append(currAlgo_df['Conflict Miss'].std())
    algoCompare['Hit/Miss Ratio avg'].append(currAlgo_df['Hit/Miss Ratio'].mean())
    algoCompare['Hit/Miss Ratio sd'].append(currAlgo_df['Hit/Miss Ratio'].std())
    algoCompare['Indices Coverage avg'].append(currAlgo_df['Indices Coverage'].mean())
    algoCompare['Indices Coverage sd'].append(currAlgo_df['Indices Coverage'].std())
    algoCompare['Address Variety avg'].append(currAlgo_df['Address Variety'].mean())
    algoCompare['Address Variety sd'].append(currAlgo_df['Address Variety'].std())
    
algoCompare_df = pd.DataFrame(algoCompare)
algoCompare_df.to_csv(file_acrossAlgo_name)



# individual algorithm