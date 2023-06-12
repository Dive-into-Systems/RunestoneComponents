'''
this algorithm generate a list of address based on the idea that
the first address should create a miss and the default ratio of hit/miss
is 1:2, while the chance of creating a hit is boosted for every miss, and 
the chance is reset to 1:2 when there is a hit
'''
import random
from randAlgoStats import RandAlgo

'''global variables'''
# init cache structure
ads_num = 8
num_bits = 8
offset_bits = 2
index_bits = 2
tag_bits = 4
binary_list = ["1", "0"]
# create reference table, stores only hit/miss information
hmRef = []
tagIndexRef = []
# the list of addresses to return
ret = []


def generateTag():
    tag = ""
    for i in range(tag_bits):
        tag += random.choice(binary_list)
    return tag

def generateIndex():
    index = ""
    for i in range(index_bits):
        index += random.choice(binary_list)
    return index

# offset is completely random
def generateOffset():
    offset = ""
    for i in range(offset_bits):
        offset += random.choice(binary_list)
    return offset

def generateOneAddress():
    offset = generateOffset()
    curr_ads = tagIndexRef[-1] + (offset ,)
    ret.append(curr_ads)

def generateReference(curr_row, chance_hit):
    if curr_row == 0: # if current row is the first row, force first one to be a miss
        hmRef.append(False)
    else: # if current row is not the first row, determine hit/miss based on chance_hit
        if hmRef[-1] == True: # if last one is hit, reset chance to initial, 1/3
            chance_hit = 1/3
        else: # otherwise, boost the chance of generating a hit
            increment =  (random.uniform(chance_hit, 1))/2
            chance_hit = chance_hit + increment
        
        # determine actual hit/miss based on the recalculated hit-miss ratio
        curr_rand = random.random()
        if (curr_rand < chance_hit): 
            hmRef.append(True)
        else:
            (hmRef.append(False))

    if curr_row == 0:
        tagIndexRef.append((generateTag(), generateIndex()))
    else:
        if hmRef[-1] == False:
            tag = generateTag()
            idx = generateIndex()
            target = tag + idx
            while (target in tagIndexRef):
                tag = generateTag()
                idx = generateIndex()
                target = tag + idx
            tagIndexRef.append((tag, idx))
        else:
            tag = generateTag()
            idx = generateIndex()
            target = tag + idx
            while (target not in tagIndexRef):
                tag = generateTag()
                idx = generateIndex()
                target = tag + idx
            tagIndexRef.append((tag, idx))

def main_boost():

    chance_hit = 1/3 # init chance of generating a hit here for smoe reason it cannot be global damn it

    for i in range(ads_num):
        generateReference(i, chance_hit)
        generateOneAddress()
        print(chance_hit)
        print(ret[-1])
        
    boost_Algo = RandAlgo()
    boost_Algo.addresses = ret
    boost_Algo.hit_miss_list = hmRef
    boost_Algo.num_refs = ads_num
    return boost_Algo

if __name__ == '__main__':
    print(main_boost())