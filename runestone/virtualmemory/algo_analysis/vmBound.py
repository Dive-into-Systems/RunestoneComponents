import random
from randAlgoStats import generateBinaryStr
from randAlgoStats import toBinary
from randAlgoStats import vmAlgo

def generateIndex(indexBits):
    return generateBinaryStr(indexBits)

def generateOffset(offsetBits):
    return generateBinaryStr(offsetBits)

def generateRef(indexBits, offsetBits, numRefs, lb, ub):
    answerList = []
    for i in range(numRefs):
        answerList.append((toBinary(random.randint(lb,ub), indexBits), generateOffset(offsetBits)))
    return answerList

def main_vm_bound(indexBits, offsetBits, numRefs, numFrames=4, rangeFrames = 5):
    numPages = 1 << indexBits
    lb = random.randint(0, numPages - rangeFrames)
    ub = lb + rangeFrames - 1
    
    vmBound = vmAlgo()
    vmBound.name = "vmBound"
    vmBound.addresses = generateRef(indexBits, offsetBits, numRefs, lb, ub)
    
    vmBound.index_bits = indexBits
    vmBound.num_pages = numPages
    vmBound.num_refs = numRefs
    vmBound.range_frames = rangeFrames
    vmBound.num_frames = numFrames
    
    vmBound.calcAll()
    
    return vmBound

if __name__ == '__main__':
    vmBound = main_vm_bound(4, 4, 10, 4, 5)
    print(vmBound)