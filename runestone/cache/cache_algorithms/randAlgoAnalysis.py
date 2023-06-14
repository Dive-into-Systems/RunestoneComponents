import os
import pandas as pd
import numpy as np
from matplotlib import pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages

from randomAds import main_random
from hitNmiss import main_hitNmiss
from boost import main_boost
from bound import main_bound
from randAlgoStats import RandAlgo, toBinary
from codeFromStackOverflow import rand_jitter, jitter

timeStamp_now = str(pd.Timestamp.now())
dir_name = "./Algorithm Test Result " + timeStamp_now


tag_bit_iterates = range(1,8)
index_bit_iterates = range(1,8)
offset_bit_iterates = [2,4]
ads_num_iterates = range(4,16)
num_reps = 20
algorithm_iterates = [main_random, main_hitNmiss, main_boost, main_bound]


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
        # print("start: index " + str(index_bits))
        for offset_bits in offset_bit_iterates:
            # print("start: offset " + str(offset_bits))
            for ads_num in ads_num_iterates:
                # print(ads_num)
                for fn in algorithm_iterates:
                    for i in range(num_reps):
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

file_table_name = dir_name + "/result " + timeStamp_now + ".csv"
os.mkdir(dir_name)
randAdsDF.to_csv(file_table_name, index=False)

# all across algorithm
file_acrossAlgo_name = dir_name + "/across algorithms analysis" + timeStamp_now + ".csv"
file_acrossAlgo_plot = dir_name + "/across algorithms analysis" + timeStamp_now + ".pdf"

print("start: algo compare")

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

algorithm_name_iterates = ["rand", "hitNmiss", "boost", "bound"]
algoComp_figs = []
for algorithm_name in algorithm_name_iterates:
    fig, ax = plt.subplots(2, 3)
    fig.tight_layout(pad=3.0)
    algoCompare["Algorithm Name"].append(algorithm_name)
    currAlgo_df = randAdsDF[randAdsDF['Algorithm Name'] == algorithm_name]
    
    algoCompare["Cold Start Miss avg"].append(currAlgo_df["Cold Start Miss"].mean())
    algoCompare["Cold Start Miss sd"].append(currAlgo_df["Cold Start Miss"].std())
    currAlgo_cold = currAlgo_df["Cold Start Miss"]
    ax[0, 0].hist(currAlgo_cold)
    ax[0, 0].set_title(str(algorithm_name) + " None Conflict Miss")
    
    algoCompare["Conflict Miss avg"].append(currAlgo_df['Conflict Miss'].mean())
    algoCompare["Conflict Miss sd"].append(currAlgo_df['Conflict Miss'].std())
    currAlgo_cflt = currAlgo_df["Conflict Miss"]
    ax[1, 0].hist(currAlgo_cflt)
    ax[1, 0].set_title(str(algorithm_name) + " Conflict Miss")
    
    algoCompare['Hit/Miss Ratio avg'].append(currAlgo_df['Hit/Miss Ratio'].mean())
    algoCompare['Hit/Miss Ratio sd'].append(currAlgo_df['Hit/Miss Ratio'].std())
    currAlgo_hm = currAlgo_df["Hit/Miss Ratio"]
    ax[0, 1].hist(currAlgo_hm)
    ax[0, 1].set_title(str(algorithm_name) + " Hit/Miss Ratio")
    
    algoCompare['Indices Coverage avg'].append(currAlgo_df['Indices Coverage'].mean())
    algoCompare['Indices Coverage sd'].append(currAlgo_df['Indices Coverage'].std())
    currAlgo_idx = currAlgo_df["Indices Coverage"]
    ax[1, 1].hist(currAlgo_idx)
    ax[1, 1].set_title(str(algorithm_name) + " Indices Coverage")
    
    algoCompare['Address Variety avg'].append(currAlgo_df['Address Variety'].mean())
    algoCompare['Address Variety sd'].append(currAlgo_df['Address Variety'].std())
    currAlgo_var = currAlgo_df["Address Variety"]
    ax[0, 2].hist(currAlgo_var)
    ax[0, 2].set_title(str(algorithm_name) + " Address Variety")
    
    algoComp_figs.append(fig)
    
algoCompare_df = pd.DataFrame(algoCompare)
algoCompare_df.to_csv(file_acrossAlgo_name)

plt_pdf = PdfPages(file_acrossAlgo_plot)

# iterating over the numbers in list
for fig in algoComp_figs: 
    
    # and saving the files
    fig.savefig(plt_pdf, format='pdf') 
    
# close the object
plt_pdf.close()  

print("start: individual algo analysis")

# individual algorithm
for algorithm_name in algorithm_name_iterates:
    curr_algo_df = randAdsDF[randAdsDF['Algorithm Name'] == algorithm_name]
    fig, ax = plt.subplots(2, 3)
    fig.tight_layout(pad=2.0)
    this_plot = dir_name + "/" + algorithm_name + " analysis" + timeStamp_now + ".pdf"
    
    ax[0, 0].scatter(rand_jitter(curr_algo_df['Number of Addresses']), rand_jitter(curr_algo_df["Cold Start Miss"]), s=1, alpha = 0.05)
    ax[0, 0].set_xlabel("# of addresses")
    ax[0, 0].set_ylabel("# of none conflict miss")
    
    ax[1, 0].scatter(rand_jitter(curr_algo_df['Number of Addresses']), rand_jitter(curr_algo_df["Conflict Miss"]), s=1, alpha = 0.05)
    ax[1, 0].set_xlabel("# of addresses")
    ax[1, 0].set_ylabel("# of conflict miss")
    
    ax[0, 1].scatter(rand_jitter(curr_algo_df['Number of Addresses']), rand_jitter(curr_algo_df["Hit/Miss Ratio"]), s=1, alpha = 0.05)
    ax[0, 1].set_xlabel("# of addresses")
    ax[0, 1].set_ylabel("hit/miss ratio")
    
    ax[1, 1].scatter(rand_jitter(curr_algo_df['Number of Addresses']), rand_jitter(curr_algo_df["Indices Coverage"]), s=1, alpha = 0.05)
    ax[1, 1].set_xlabel("# of addresses")
    ax[1, 1].set_ylabel("indices coverage")
    
    ax[0, 2].scatter(rand_jitter(curr_algo_df['Number of Addresses']), rand_jitter(curr_algo_df["Address Variety"]), s=1, alpha = 0.05)
    ax[0, 2].set_xlabel("# of addresses")
    ax[0, 2].set_ylabel("# of address variety")

    fig.savefig(this_plot, format = "pdf")
