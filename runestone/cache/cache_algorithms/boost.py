'''
this algorithm generate a list of address based on the idea that
the first address should create a miss and the default ratio of hit/miss
is 1:2, while the chance of creating a hit is boosted for every miss, and 
the chance is reset to 1:2 when there is a hit
'''
import random
from randAlgoStats import RandAlgo

random.seed()

'''global variables'''

binary_list = ["1", "0"]
# create reference table, stores only hit/miss information
hmRef = []
tagIndexRef = []
# the list of addresses to return
ret = []


# ads_num = 8
# offset_bits = 2
# index_bits = 2
# tag_bits = 4

def fullCoverage(tag_bits, index_bits, tagIndexRef):
    allComb = pow(2, tag_bits)*pow(2, index_bits)
    coverage = len(set(tagIndexRef))
    if (coverage >= allComb):
        return True
    else:
        return False

def generateTag(tag_bits):
    tag = ""
    for i in range(tag_bits):
        tag += random.choice(binary_list)
    return tag

def generateIndex(index_bits):
    index = ""
    for i in range(index_bits):
        index += random.choice(binary_list)
    return index

# offset is completely random
def generateOffset(offset_bits):
    offset = ""
    for i in range(offset_bits):
        offset += random.choice(binary_list)
    return offset

def generateOneAddress(offset_bits):
    offset = generateOffset(offset_bits)
    curr_ads = tagIndexRef[-1] + (offset ,)
    ret.append(curr_ads)

def generateReference(curr_row, chance_hit, index_bits, tag_bits):
    if curr_row == 0: # if current row is the first row, force first one to be a miss
        hmRef.append(False)
    else: # if current row is not the first row, determine hit/miss based on chance_hit
        if hmRef[-1] == True: # if last one is hit, reset chance to initial, 1/3
            chance_hit = 1/3
        else: # otherwise, boost the chance of generating a hit
            increment = (round(random.uniform(chance_hit, 1), 2))*(2/3)
            chance_hit = chance_hit + increment
        
        # determine actual hit/miss based on the recalculated hit-miss ratio
        curr_rand = random.random()
        if (curr_rand < chance_hit): 
            hmRef.append(True)
        else:
            hmRef.append(False)

    # print(chance_hit)
    if curr_row == 0: # if current row is the first row, randomly generate a tag + index combination
        tagIndexRef.append((generateTag(tag_bits), generateIndex(index_bits)))
    else:
        if hmRef[-1] == False:
            tag = generateTag(tag_bits)
            idx = generateIndex(index_bits)
            target = (tag, idx)
            # print("When miss: @@@target: " + str(target))
            # print("@@@tagIndexRef: " + str(tagIndexRef))
            while (target in tagIndexRef):
                if fullCoverage(tag_bits, index_bits, tagIndexRef):
                    target = random.choice(tagIndexRef)
                    break
                tag = generateTag(tag_bits)
                idx = generateIndex(index_bits)
                target = (tag, idx)
            tagIndexRef.append(target)
        else:
            tag = generateTag(tag_bits)
            idx = generateIndex(index_bits)
            target = (tag, idx)
            # print("When hit: @@@target: " + str(target))
            # print("@@@tagIndexRef: " + str(tagIndexRef))
            # when want to create a hit, choose a random, existing tag+index combination
            target = random.choice(tagIndexRef)
            tagIndexRef.append(target)

def main_boost(ads_num, offset_bits, index_bits, tag_bits):

    chance_hit = 1/3 # init the chance of generating a hit, start at 1/3

    for i in range(ads_num):
        generateReference(i, chance_hit, index_bits, tag_bits)
        generateOneAddress(offset_bits)

    boost_Algo = RandAlgo()
    boost_Algo.name = 'boost'
    boost_Algo.addresses = ret
    boost_Algo.hit_miss_list = hmRef
    
    boost_Algo.num_refs = ads_num
    boost_Algo.index_bits = index_bits
    boost_Algo.num_rows = 1 << index_bits
    
    boost_Algo.calcAll()
    return boost_Algo

if __name__ == '__main__':
    print(main_boost(8,2,1,1))
