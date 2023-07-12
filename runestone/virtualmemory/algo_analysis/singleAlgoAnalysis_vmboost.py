import os
import pandas as pd
import numpy as np
from matplotlib import pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages

from vmBoost import main_vm_boost

# ------ preparation ------ #

timeStamp_now = str(pd.Timestamp.now())
dir_name = "./vmBoost Test Result " + timeStamp_now
# create a directory
file_table_name = dir_name + "/result " + timeStamp_now + ".csv"
os.mkdir(dir_name)

# set up all params to permute through the test runs (indexBits, offsetBits, numRefs, numFrames=4, rangePages = 5, occupancy = 0)
ads_num = 8
rangeFrameIterates = [[6, 4], [8, 4], [8, 5], [8, 6]]
occupancyIterates = [0,1,2,3]
pageOffset1 = [[3,5], [4,4], [5,3]]
rateSets = [[1/2, 1/4, 1/4], [1/4, 1/4, 1/4], [1/2, 1/4, 1/8], [3/4, 1/4, 1/4], [2/3, 1/3, 1/3], [1/3, 1/3, 1/3], [2/3, 1/3, 1/6], [1/3, 1/3, 1/6]]
num_reps = 500




# ------ experiment ------ #

def drawCurrAlgoHist(currAdsDF, algorithm_name, file_gen_name):
    fig, ax = plt.subplots(2, 2)
    fig.tight_layout(pad=3.0)
    
    ax[0, 0].hist(currAdsDF["Hits"])
    ax[0, 0].set_title(str(algorithm_name) + "_Hits")
    
    ax[1, 0].hist(currAdsDF["PF_evict"])
    ax[1, 0].set_title(str(algorithm_name) + "_PageFault_evict")
    
    ax[0, 1].hist(currAdsDF["PF_noEvict"])
    ax[0, 1].set_title(str(algorithm_name) + "_PageFault_noevict")

    ax[1, 1].hist(currAdsDF["Indices Coverage"])
    ax[1, 1].set_title(str(algorithm_name) + "_IndicesCoverage")
    
    this_plot = file_gen_name + ".pdf"
    fig.savefig(this_plot, format = "pdf")
    plt.close()

subfolder = "/Result each param set " + timeStamp_now
os.mkdir(dir_name + subfolder)
# nested for loop that loops through every "valid" set of parameters for num_reps trails
# statistics specific to each trail is recorded as a new "index" in randomAdsSet or a new row in the dataframe
for pageOffset in [pageOffset1]:
    for pf_chance_base, pf_chance_boost, pf_chance_reduce in rateSets:
    # create a dictionary
    # - the dictionary map attribute name (str) to trail results (list)
    # - the index of an element in the lists means the index of that trail in the experiment
    # - the dictionary is later converted to a dateframe for data analysis
        randAdsDF = pd.DataFrame(columns=['Index Bits','Offset Bits','Number of Addresses',
                                        'Algorithm Name','Occupancy','Number of Frames',
                                        'Range of Pages','Hits','PF_evict','PF_noEvict','Indices Coverage'])
        for occupancy in occupancyIterates:
            for range_pages, num_frames in rangeFrameIterates:
                for index_bits, offset_bits in pageOffset:
                    currAdsSet  = {
                        'Index Bits' : [],
                        'Offset Bits' : [],
                        'Number of Addresses' : [],
                        'Algorithm Name' : [],
                        'Occupancy' : [],
                        'Number of Frames' : [],
                        'Range of Pages' : [],
                        'Hits' : [],
                        'PF_evict' : [],
                        'PF_noEvict' : [],
                        'Indices Coverage' : []
                    }
                    for i in range(num_reps):
                        ads_len = index_bits + offset_bits
                        currAlgo = main_vm_boost(index_bits, offset_bits, ads_num, pf_chance_base, pf_chance_boost, pf_chance_reduce, num_frames, range_pages, occupancy)
                        currAdsSet['Index Bits'].append(index_bits)
                        currAdsSet['Offset Bits'].append(offset_bits)
                        currAdsSet['Number of Addresses'].append(ads_num)
                        currAdsSet['Algorithm Name'].append(currAlgo.name)
                        currAdsSet['Occupancy'].append(currAlgo.occupancy)
                        currAdsSet['Number of Frames'].append(currAlgo.num_frames)
                        currAdsSet['Range of Pages'].append(currAlgo.range_pages)
                        currAdsSet['Hits'].append(currAlgo.hit_count)
                        currAdsSet['PF_evict'].append(currAlgo.pf_evict)
                        currAdsSet['PF_noEvict'].append(currAlgo.pf_noEvict)
                        currAdsSet['Indices Coverage'].append(currAlgo.indices_coverage)
                    currAdsDF = pd.DataFrame(currAdsSet)
                    # create a directory
                    file_gen_name = dir_name + subfolder + "/" + currAlgo.name + "_result" + timeStamp_now + "_index" + str(index_bits) + "_offset" + str(offset_bits) + "_adsnum" + str(ads_num) + "_reps" + str(num_reps) + "_base" + str(pf_chance_base) + "_boost" + str(pf_chance_boost) + "_reduce" + str(pf_chance_reduce) + "_numFrames" + str(num_frames) + "_rangePages" + str(range_pages) + "_occupancy" + str(occupancy)
                    file_table_name = file_gen_name + ".csv"
                    # the dataframe for current set of parameters is stored to the directory
                    currAdsDF.to_csv(file_table_name, index=False)
                    #print("start drawing")
                    drawCurrAlgoHist(currAdsDF, currAlgo.name, file_gen_name)
                    #print("finished")
                    randAdsDF = pd.concat([randAdsDF, currAdsDF], ignore_index = True)        
    
        file_acrossAlgo_name = dir_name + "/vmboost analysis ads_len=" + str(ads_len) + "_base" + str(pf_chance_base) + "_boost" + str(pf_chance_boost) + "_reduce" + str(pf_chance_reduce) + ".csv"
        file_plot_name = dir_name + "/vmboost analysis plot ads_len=" + str(ads_len) + "_base" + str(pf_chance_base) + "_boost" + str(pf_chance_boost) + "_reduce" + str(pf_chance_reduce) + ".pdf"
        # set up the dictionary (to be converted to dataframe)
        algoCompare = {
            "Algorithm Name" : [],
            "Hits avg" : [],
            "Hits sd" : [],
            "Page Fault w/ evict avg" : [],
            "Page Fault w/ evict sd" : [],
            'Page Fault no evict avg' : [],
            'Page Fault no evict sd' : [],
            'Indices Coverage avg' : [],
            'Indices Coverage sd' : []
        }
        fig, ax = plt.subplots(2, 2)
        fig.tight_layout(pad=3.0)
        currAlgo_df = randAdsDF
        algorithm_name = "vmBound"
        algoCompare["Algorithm Name"].append(algorithm_name)
        
        # calculate mean and std of cold start miss count
        algoCompare["Hits avg"].append(currAlgo_df["Hits"].mean())
        algoCompare["Hits sd"].append(currAlgo_df["Hits"].std())
        currAlgo_hits = currAlgo_df["Hits"]
        # draw the histogram for hit
        ax[0, 0].hist(currAlgo_hits)
        ax[0, 0].set_title(str(algorithm_name) + " Hits")
        
        # calculate mean and std of conflict miss count
        algoCompare["Page Fault w/ evict avg"].append(currAlgo_df['PF_evict'].mean())
        algoCompare["Page Fault w/ evict sd"].append(currAlgo_df['PF_evict'].std())
        currAlgo_pe = currAlgo_df["PF_evict"]
        # draw the histogram for page fault
        ax[1, 0].hist(currAlgo_pe)
        ax[1, 0].set_title(str(algorithm_name) + " Page Fault w/ evict")
        
        # calculate the mean and std of Page Fault no evict
        algoCompare['Page Fault no evict avg'].append(currAlgo_df['PF_noEvict'].mean())
        algoCompare['Page Fault no evict sd'].append(currAlgo_df['PF_noEvict'].std())
        currAlgo_pnv = currAlgo_df["PF_noEvict"]
        # draw the histogram of Page Fault no evict
        ax[0, 1].hist(currAlgo_pnv)
        ax[0, 1].set_title(str(algorithm_name) + " Page Fault no evict avg")
        
        # calculate the mean and std of indices coverage
        algoCompare['Indices Coverage avg'].append(currAlgo_df['Indices Coverage'].mean())
        algoCompare['Indices Coverage sd'].append(currAlgo_df['Indices Coverage'].std())
        currAlgo_idx = currAlgo_df["Indices Coverage"]
        # draw the histogram of indices coverage
        ax[1, 1].hist(currAlgo_idx)
        ax[1, 1].set_title(str(algorithm_name) + " Indices Coverage")
        
        
        fig.savefig(file_plot_name, format = "pdf")

        # save the dataframe
        algoCompare_df = pd.DataFrame(algoCompare)
        algoCompare_df.to_csv(file_acrossAlgo_name)

