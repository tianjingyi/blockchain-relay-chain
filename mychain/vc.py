import math
import sys
import re

from datetime import datetime

from Crypto.Util import number
import hashlib
import binascii
import random
import copy

import time

def current_milli_time():
    # 四舍五入
    return round(time.time() * 1000)

def countTotalBits(num):
    # 得到二进制表示，再取从下标2到末尾
     binary = bin(num)[2:]
     return len(binary)


def verify(C, m, i, A, S, messages, e, n):
    # pow(x,y,z)：表示x的y次幂后除以z的余数。
    AtoE =pow(A, e[i], n)
    newC = AtoE*pow(S[i], m, n)%n

    if(C == newC):
        return 1
    else:
        return 0

# def s_gen(messages, e, a, n):
#     S =[]

#     for i in range(len(messages)):
#         alt = a
#         for j in range(len(messages)):
#             if(j==i):
#                 continue
#             alt = pow(alt, e[j], n)
#         S.append(alt)
#     return S

# def slow_open(messages, e, a, n, i):
#     prod = 1
#     for j in range(len(messages)):
#         if(j == i):
#             continue
#         alt = a
#         for k in range(len(messages)):
#             if(k == i or  k == j):
#                 continue
#             alt = pow(alt, e[k], n)

#         part = alt
#         prod = (prod*pow(part, messages[j], n))%n

#     return prod

def keygen(messages, l):
    p =number.getPrime(1024)
    q = number.getPrime(1024)
    n = p*q
    a = 5

    maxBits = l

    randprimes = []
    while True:
        tempprime = number.getPrime(maxBits + 1)
        alreadyUsed = False
        for num in randprimes:
            if tempprime == num:
                alreadyUsed = True
        if alreadyUsed:
            continue
        randprimes.append(tempprime)
        if len(randprimes) == len(messages):
            break
    # randprimes: e1,...,eq
    S = fast_gen(randprimes, a, n)
    # S = s_gen(messages, randprimes, a, n)
    return n, randprimes, a, S

# 生成S
def fast_gen(primes, partial_a, n): #divide and conquer approach to generating S values
    num = len(primes)
    if num == 1:
        return [partial_a]

    A1 = []
    A2 = []

    partial_a1 = partial_a
    partial_a2 = partial_a

    for i in range(math.floor(len(primes)/2)):
        partial_a2 = pow(partial_a2, primes[i], n)
        A1.append(primes[i])
    for i in range(math.floor(len(primes)/2), len(primes)):
        partial_a1 = pow(partial_a1, primes[i], n)
        A2.append(primes[i])

    R1 = fast_gen(A1, partial_a1, n)
    R2 = fast_gen(A2, partial_a2, n)

    R = []
    for element in R1:
        R.append(element)
    for element in R2:
        R.append(element)

    return R

# 生成承诺C
def commit(messages, S, n):
    c = 1
    for i in range(len(messages)):
        c = (c*pow(S[i], messages[i], n))%n
    return c

#open using our divide and conquer
#we actually dont need to implement new algorithm to get around the fact that we need the e_i th root
#we just remove e_i from our list of primes then generate the S values
# i位置上的证明
def open(messages, e, a, n, i):
    newlist = copy.deepcopy(e)
    newlist.remove(e[i])
    # 生成删除e[i]后的S
    fgen = fast_gen(newlist, a, n)
    # fgen = s_gen(messages, newlist, a, n)
    prod = 1

    messageInc = 0
    for j in range(len(fgen)): #raise each s to each message, need different incrementers because one S value is gone
        if(messageInc == i):
            messageInc += 1
        prod = (prod*pow(fgen[j], messages[messageInc], n))%n
        messageInc += 1

    return prod

def text2int(text):
    num = []
    for i in text:
        num.append(int(binascii.hexlify(i.encode()), 16))
    return num

def update(c, S, oldm, newm, i, n):

    diff = pow(S[i], newm - oldm, n)
    newC = (c*diff)%n
    return newC

def updateProof(oldProof, e, oldm, newm, a, i, j, n):
    alt = a
    for k in range(len(e)):
        if(k == i or k == j):
            continue
        alt = pow(alt, e[k], n)

    rootS = alt
    right = pow(rootS, newm - oldm, n)
    full = (oldProof*right)%n
    return full


def main():
    # sys.setrecursionlimit(5000)
    # # print(sys.argv[1])
    # # messages = [12312, 132131, 5112321312324]
    # 验证的时候下标要从1开始
    messages = ['prepare']
    req = sys.argv[1].split(',')
    for item in req:
        messages.append(item)
    
    messages_ascii = []
    for message in messages:
        message_ascii = []
        for character in message:
            message_ascii.append(ord(character))
            message_ascii_str = ''.join(str(i) for i in message_ascii)
        messages_ascii.append(message_ascii_str)

    for index in range(len(messages_ascii)):
        messages_ascii[index] = int(messages_ascii[index])

    n, e, a, S = keygen(messages_ascii, 30) #generate key and proof and verify it for a simple situation

    c = commit(messages_ascii, S, n)
    
    proofs = []
    for index in range(len(messages_ascii)):
        proof = open(messages_ascii, e, a, n, index)
        proofs.append(proof)
    
    print(proofs)

    # # 0位置上的证明
    # proof = open(messages, e, a, n, 0)
    # # 1位置上的证明
    # oldProof = open(messages, e, a, n, 1) #will use later

    # verified = verify(c, messages_ascii[1], 1, proofs[1], S, messages_ascii, e, n)
    # if(not verified):
    #     print("ERROR: couldnt verify good proof")
    # else:
    #     print("Verifying worked")

    # notverified = verify(c, messages_ascii[2], 1, proofs[1], S, messages_ascii, e, n)
    # if(notverified):
    #     print("ERROR: didn't reject bad proof")
    # else:
    #     print("Rejecting bad proof works")

main()
