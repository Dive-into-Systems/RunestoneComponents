'''
this algorithm generate a list of address based on the idea that
the first address should create a miss and the default ratio of hit/miss
is 1:2, while the chance of creating a hit is boosted for every miss, and 
the chance is reset to 1:2 when there is a hit
'''
import random
from randAlgoStats import RandAlgo
from randAlgoStats import toBinary
random.seed()

def fullCoverage(tag_bits, index_bits, tagIndexRef):
    allCombination = pow(2, tag_bits)*pow(2, index_bits)
    coverage = len(set(tagIndexRef))
    if (coverage < allCombination):
        return False
    else:
        return True

def generateTag(tag_bits):
    tag = ""
    for i in range(tag_bits):
        tag += random.choice(["1", "0"])
    return tag

def generateIndex(index_bits):
    index = ""
    for i in range(index_bits):
        index += random.choice(["1", "0"])
    return index

# offset is completely random
def generateOffset(offset_bits):
    offset = ""
    for i in range(offset_bits):
        offset += random.choice(["1", "0"])
    return offset

def generateOneAddress(curr_row, num_rows, chance_hit, offset_bits, index_bits, tag_bits, tagIndexRef, hmRef):
    if curr_row == 0: # if current row is the first row, force first one to be a miss
        hmRef.append(False)
    else: # if current row is not the first row, determine hit/miss based on chance_hit
        if hmRef[-1] == True: # if last one is hit, reset chance to initial, 1/3
            chance_hit = 1/3
        else: # otherwise, boost the chance of generating a hit
            increment = (round(random.uniform(chance_hit, 1), 2))*(2/3)
            chance_hit = chance_hit + increment
        
        curr_rand = random.random() # determine hit/miss based on new ratio
        if (curr_rand < chance_hit): 
            hmRef.append(True)
        else:
            hmRef.append(False)
    
    validTagIndex = []
    for x in range(num_rows):
        if (tagIndexRef[x][1] == True):
            validTagIndex.append(tagIndexRef[x][0] + toBinary(x, index_bits))

    if hmRef[-1] == False:
        target = generateTag(tag_bits) + generateIndex(index_bits)
        # print("When miss: @@@target: " + str(target))
        # print("@@@tagIndexRef: " + str(tagIndexRef))
        while (target in validTagIndex):
            # if fullCoverage(tag_bits, index_bits, tagIndexRef):
            #     target = random.choice(validTagIndex)
            #     break
            target = generateTag(tag_bits) + generateIndex(index_bits)
    else:
        # print("When hit: @@@target: " + str(target))
        # print("@@@tagIndexRef: " + str(tagIndexRef))
        # when want to create a hit, choose from an existing tag+index combination
        target = random.choice(validTagIndex)
    
    tagStr = target[0 : tag_bits]
    idxStr = target[tag_bits:]

    idxInt = int(idxStr, 2)

    # print(tagIndexRef)
    # print(idxInt)
    tagIndexRef[idxInt][0] = tagStr
    tagIndexRef[idxInt][1] = True

    return (tagStr, idxStr, generateOffset(offset_bits))
    

def main_boost(ads_num, offset_bits, index_bits, tag_bits):

    # create reference table, stores only hit/miss information
    hmRef = []
    tagIndexRef = []
    # the list of addresses to return
    ret = []

    chance_hit = 1/3 # init the chance of generating a hit, start at 1/3

    num_rows = 1 << index_bits
    # init tag+index reference map where boolean indicates whether the block is still on the table
    for i in range(num_rows):
        tagIndexRef.append(["", False])
    for i in range(ads_num):
        oneAds = generateOneAddress(i, num_rows, chance_hit, offset_bits, index_bits, tag_bits, tagIndexRef, hmRef)
        ret.append(oneAds)

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
