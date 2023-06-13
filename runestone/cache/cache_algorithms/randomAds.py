from random import *
from randAlgoStats import RandAlgo

def generateTag(tag_bits):
    tag = ""
    for i in range(tag_bits):
        rand = random()
        if (rand < 0.5):
            tag += "1"
        else:
            tag += "0"
    return tag

def generateIndex(index_bits):
    index = ""
    for i in range(index_bits):
        rand = random()
        if (rand < 0.5):
            index += "1"
        else:
            index += "0"
    return index

def generateOffset(offset_bits):
    offset = ""
    for i in range(offset_bits):
        rand = random()
        if (rand < 0.5):
            offset += "1"
        else:
            offset += "0"
    return offset

def generateOneAddress(tag_bits, index_bits, offset_bits):
    return (generateTag(tag_bits), generateIndex(index_bits), generateOffset(offset_bits))


def main_random(ads_num, offset_bits, index_bits, tag_bits):

    rand_Algo = RandAlgo()
    rand_Algo.name = "rand"
    
    num_rows = 1 << index_bits
    
    for i in range(ads_num):
        rand_Algo.addresses.append(generateOneAddress(tag_bits, index_bits, offset_bits))
    
    rand_Algo.index_bits = index_bits
    rand_Algo.num_rows = num_rows
    rand_Algo.num_refs = ads_num
    rand_Algo.calcAll()
    return rand_Algo

if __name__ == '__main__':
    rand_Algo = main_random(8,2,2,4)
    print(rand_Algo)