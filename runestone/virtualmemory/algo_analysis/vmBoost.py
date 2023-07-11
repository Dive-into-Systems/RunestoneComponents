import random
from collections import deque
from vmAlgoStats import generateBinaryStr
from vmAlgoStats import toBinary
from vmAlgoStats import binary2decimal
from vmAlgoStats import vmAlgo


def generateIndex(indexBits, lb, ub):
    return toBinary(random.randint(lb,ub), indexBits)

def generateOffset(offsetBits):
    return generateBinaryStr(offsetBits)

def findPage(replacementStruct, currPage):
    for i in range(len(replacementStruct)):
        if currPage == replacementStruct[i][1]:
            return i
    return -1

def replacementFIFO(replacementStruct, currPage, numFrames, invalid):
    idx = findPage(replacementStruct, currPage)
    if (idx == -1):
        if (len(replacementStruct) < numFrames):
            replacementStruct.append([len(replacementStruct), currPage])
            invalid.remove(binary2decimal(currPage))
            return [len(replacementStruct) - 1, -1, False, False]
        else:
            currFrame, evictedPage = replacementStruct.popleft()
            invalid.add(binary2decimal(evictedPage))
            invalid.remove(binary2decimal(currPage))
            replacementStruct.append([currFrame, currPage])
            return [currFrame, evictedPage, False, True]
    else:
        return [replacementStruct[idx][0], -1, True, False]

def setOccupancy(occupancy, indexBits, offsetBits, numFrames, addresses, replacementStruct, invalid):
    for i in range(occupancy):
        currPage = random.choice(list(invalid))
        currPage = toBinary(currPage, indexBits)
        replacementFIFO(replacementStruct, currPage, numFrames, invalid)
        addresses.append((currPage, generateOffset(offsetBits)))
    

def generateRef(indexBits, offsetBits, numRefs, numFrames, addresses, replacementStruct, invalid):
    pf_chance_curr = 3/4
    pf_chance_boost = 1/4
    pf_chance_reduce = 1/8
    
    for i in range(numRefs):
        if len(replacementStruct) == 0 or (random.random() < pf_chance_curr):
            currPage = random.choice(list(invalid))
            currPage = toBinary(currPage, indexBits)
            replacementFIFO(replacementStruct, currPage, numFrames, invalid)
            addresses.append((currPage, generateOffset(offsetBits)))
            pf_chance_curr -= pf_chance_reduce
        else:
            currPage = random.choice(list(replacementStruct))[1]
            addresses.append((currPage, generateOffset(offsetBits)))
            pf_chance_curr += pf_chance_boost
            

def main_vm_bound(indexBits, offsetBits, numRefs, numFrames=4, rangePages = 5, occupancy = 0):
    numPages = 1 << indexBits
    lb = random.randint(0, numPages - rangePages)
    ub = lb + rangePages - 1
    
    replacementStruct = deque()
    
    invalid = set()
    for i in range(lb, ub+1):
        invalid.add(i)
    
    vmBound = vmAlgo("vmBoost", occupancy, indexBits, numPages, numFrames, rangePages, lb, numRefs)
    addresses = []
    setOccupancy(occupancy, indexBits, offsetBits, numFrames, addresses, replacementStruct, invalid)
    generateRef(indexBits, offsetBits, numRefs, numFrames, addresses, replacementStruct, invalid)
    vmBound.addresses = addresses
    
    vmBound.calcAll()
    
    return vmBound

if __name__ == '__main__':
    vmBound = main_vm_bound(4, 4, 8, 4, 8, 2)
    print(vmBound)