# generate a list of address based on the idea that when we have
# two hits then the next one should be a miss and its inverse

from random import choice
from math import pow
from randAlgoStats import RandAlgo

tag_bits = 4
index_bits = 2
offset_bits = 2
num_rows = pow(2, index_bits)
hit_miss_list = []
curr_tagIndex_table = []
index_all = ["00", "01", "10", "11"]
ads_num = 8

def generateTag():
    tag = ""
    for i in range(tag_bits):
        tag += choice(["0", "1"])
    return tag

def generateIndex():
    index = ""
    for i in range(index_bits):
        index += choice(["0", "1"])
    return index

# offset is completely random
def generateOffset():
    offset = ""
    for i in range(offset_bits):
        offset += choice(["0", "1"])
    return offset


def generateOneAddress(curr_ref):
    if (curr_ref == 0): # first always a miss
        curr_hm = False
    elif (curr_ref == 1): # second half half
        curr_hm = choice([True, False])
    else:
        # if previous two hits, miss this time
        if (hit_miss_list[curr_ref - 2] and hit_miss_list[curr_ref - 1]):
            curr_hm = False
        else: # otherwise half half
            curr_hm = choice([True, False])               
    hit_miss_list.append(curr_hm)    
    
    # generate current tagIndex
    valid_tagIndex_list = []
    for j in range(4): # collect all current valid tagIndices
        if (curr_tagIndex_table[j][0] == 1):
            valid_tagIndex_list.append(curr_tagIndex_table[j][1] + index_all[j])
    if (curr_hm):
        # if it is a hit, pick a valid tagIndex to proceed
        currtagIndex = choice(valid_tagIndex_list)
    else:
        # if it is a miss, then generate a new tagIndex
        currtagIndex = generateTag() + generateIndex()
        while (currtagIndex in valid_tagIndex_list):
            currtagIndex = generateTag() + generateIndex()
    curr_tag_b = currtagIndex[0: tag_bits]
    curr_idx_b = currtagIndex[tag_bits: tag_bits + index_bits]
    curr_idx_d = int(curr_idx_b, 2)
    

    
    # reflect the changes in answer_list and curr_tagIndex_table
    curr_tagIndex_table[curr_idx_d][0] = 1 # change valid bit to 1
    curr_tagIndex_table[curr_idx_d][1] = curr_tag_b # change tag to corresponding string

    return (curr_tag_b, curr_idx_b, generateOffset())

def main_hitNmiss():
    hitNmiss_Algo = RandAlgo()
    for i in range(int(num_rows)):
        curr_tagIndex_table.append([0, ""])
    for i in range(ads_num):
        x = generateOneAddress(i)
        hitNmiss_Algo.addresses.append(x)
    hitNmiss_Algo.hit_miss_list = hit_miss_list
    hitNmiss_Algo.num_rows = num_rows
    hitNmiss_Algo.num_refs = ads_num
    return hitNmiss_Algo
    
    
if __name__ == '__main__':
    print(main_hitNmiss())