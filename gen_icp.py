#!/usr/bin/python

"""
2D Generalized ICP

WHAT:

This is a python implementation of the generalized ICP algorithm described in:
"Generalized-ICP", Aleksandr V. Segal, Dirk Haehnel, and Sebastian Thrun, In Robotics: Science and Systems 2009

Paper available on Aleksander Segal's personal website:
http://www.stanford.edu/~avsegal/

TO INSTALL:

This code requires 3 modules to be installed on your system.  Numpy, Scipy, and the Python NIPALS PCA module by Henning Risvik.

http://www.scipy.org/kk

http://numpy.scipy.org/

http://folk.uio.no/henninri/pca_module/


TO RUN:

To run the example program, simply execute this file from the command-line with the following command:
python gen_icp.py

Copy the main section to your own code to have a working implementation and include this file as a module.

This code is provided under the GNU General Public License, Version 3

Copyright 2009, by Jacob Everist
jacob.everist@gmail.com

http://jacobeverist.com/gen_icp

"""

import numpy
import scipy
import scipy.linalg
import scipy.optimize
import math
import pylab
import pca_module

from copy import copy
from copy import deepcopy

# displace the point by the offset plus modify it's covariance
def dispPoint(p, offset):
	xd = offset[0]
	yd = offset[1]
	theta = offset[2]

	T = numpy.matrix([	[math.cos(theta), -math.sin(theta), xd],
			[math.sin(theta), math.cos(theta), yd],
			[0.0, 0.0, 1.0]
		    ])

	p_hom = numpy.matrix([[p[0]],[p[1]],[1.0]])
	temp = T*p_hom
	p_off = [temp[0,0],temp[1,0]]


	R = numpy.matrix([	[math.cos(theta), -math.sin(theta)],
		[math.sin(theta), math.cos(theta)] ])

	Cv = p[2]
	Ca = R * Cv * numpy.transpose(R)
	p_off.append(Ca)

	return p_off

# displace the point by the offset only.  No covariance
def dispOffset(p, offset):
	xd = offset[0]
	yd = offset[1]
	theta = offset[2]

	T = numpy.matrix([	[math.cos(theta), -math.sin(theta), xd],
			[math.sin(theta), math.cos(theta), yd],
			[0.0, 0.0, 1.0]
		    ])

	p_hom = numpy.matrix([[p[0]],[p[1]],[1.0]])
	temp = T*p_hom
	p_off = [temp[0,0],temp[1,0]]

	return p_off


def disp(ai, bi, T):

	temp = T*ai
	result = bi-temp

	result[2] = 1.0

	return result


def computeMatchError(offset, a, b, Ca, Cb):

	xd = offset[0]
	yd = offset[1]
	theta = offset[2]

	T = numpy.matrix([	[math.cos(theta), -math.sin(theta), xd],
			[math.sin(theta), math.cos(theta), yd],
			[0.0, 0.0, 1.0]
		    ])

	R = numpy.matrix([	[math.cos(theta), -math.sin(theta)],
		[math.sin(theta), math.cos(theta)] ])

	Cv = Ca

	d_vec = disp(numpy.concatenate((a,numpy.matrix([1.0]))), numpy.concatenate((b,numpy.matrix([1.0]))), T)

	res = Cb + R * Cv * numpy.transpose(R)

	# remove the 3rd homogeneous dimension for inverse
	invMat = scipy.linalg.inv(res)

	# add homogeneous dimension back
	invMat = numpy.concatenate((invMat,numpy.matrix([[0.0],[0.0]])), 1)
	invMat = numpy.concatenate((invMat,numpy.matrix([0.0,0.0,0.0])))

	error = numpy.transpose(d_vec)*invMat*d_vec
	errVal = error[0,0]

	return errVal

def findLocalNormal(pnt,points):

	x_list = []
	y_list = []

	pnt_count = 0
	pnts_copy = deepcopy(points)

	while pnt_count < 10:
		# select 3 closest points
		minDist = 1e100
		minPoint = []
		for p in pnts_copy:
			dist = math.sqrt((p[0]-pnt[0])**2 + (p[1]-pnt[1])**2)

			if dist < minDist:
				minDist = dist
				minPoint = p

		x_list.append(minPoint[0])
		y_list.append(minPoint[1])

		pnts_copy.remove(minPoint)
		pnt_count += 1

	x_list.append(pnt[0])
	y_list.append(pnt[1])

	cov_a = scipy.cov(x_list,y_list)

	loadings = []

	# NOTE:  seems to create opposing colinear vectors if data is colinear, not orthogonal vectors

	try:
		scores, loadings, E = pca_module.nipals_mat(cov_a, 2, 0.000001, False)

	except:
		raise

	if len(loadings) < 2:
		raise

	# return the second vector returned from PCA because this has the least variance (orthogonal to plane)
	return loadings[1]

def computeVectorCovariance(vec,x_var,y_var):
	Cv = numpy.matrix([	[x_var, 0.0],
			[0.0, y_var]
		    ])

	mag = math.sqrt(vec[0]**2 + vec[1]**2)
	normVec = [vec[0]/mag, vec[1]/mag]

	if normVec[1] == 0:
		R = numpy.matrix([	[1.0, 0.0],
				[0.0, 1.0]
			    ])

	else:
		B = -1 / (normVec[1] + normVec[0]**2/normVec[1])
		A = -normVec[0]*B/normVec[1]
		R = numpy.matrix([	[A, -B],
				[B, A]
			    ])

	Ca = numpy.transpose(R) * Cv * R

	return Ca

# for point T*a, find the closest point b in B
def findClosestPointInB(b_data, a, offset):

	xd = offset[0]
	yd = offset[1]
	theta = offset[2]

	T = numpy.matrix([	[math.cos(theta), -math.sin(theta), xd],
			[math.sin(theta), math.cos(theta), yd],
			[0.0, 0.0, 1.0]
		    ])


	a_hom = numpy.matrix([[a[0]],[a[1]],[1.0]])
	temp = T*a_hom
	a_off = [temp[0,0],temp[1,0]]

	minDist = 1e100
	minPoint = None

	for p in b_data:

	 	dist = math.sqrt((p[0]-a_off[0])**2 + (p[1]-a_off[1])**2)
		if dist < minDist:
			minPoint = copy(p)
			minDist = dist


	if minPoint != None:
		return minPoint, minDist
	else:
		raise


def cost_func(offset, match_pairs):

	sum = 0.0
	for pair in match_pairs:

                a = numpy.matrix([[pair[0][0]],[pair[0][1]]])
                b = numpy.matrix([[pair[1][0]],[pair[1][1]]])
                sum += computeMatchError(offset, a, b, pair[2], pair[3])

		# NOTE:  standard point-to-point ICP
                #a = numpy.matrix([[pair[0][0]],[pair[0][1]],[1.0]])
                #b = numpy.matrix([[pair[1][0]],[pair[1][1]],[1.0]])

                #distVec = disp(a, b, T)
                #mag = distVec[0,0]**2 + distVec[1,0]**2
                #sum += mag

	return sum

def precomputeCovariance(points, high_var=1.0, low_var=0.001):

	for p in points:
		C = numpy.matrix([	[high_var, 0.0],
				[0.0, high_var]
				])

		try:
			# the covariance matrix that enforces the point-to-plane constraint
			normVec = findLocalNormal(p,points)
			C = computeVectorCovariance(normVec,low_var,high_var)

		except:
			pass

		p.append(C)

def gen_ICP(offset, a_data, b_data, costThresh = 0.004, minMatchDist = 2.0, plotIter = False):

	# 1. compute the local line for each point
	# 2. compute the covariance for point-to-line constraint
	# 3. find closest points in A of B
	# 4. discard matches beyond threshold d_max < | ai - T *bi |
	# 5. optimize T for the sum of computeMatchError
	# 6. if converged, stop, else go to 3 with b offset by new T

	# DONE:  store the covariance for each point untransformed so we don't have to repeat
	# DONE:  transform each covariance by the appropriate rotation at each point

	# compute the local covariance matrix for a point-to-plane contrainst
	precomputeCovariance(a_data)
	precomputeCovariance(b_data)

	numIterations = 0
	lastCost = 1e100

	while True:

		a_trans = []

		# pre-transform the A points and their associated covariances
		for p in a_data:
			a_trans.append(dispPoint(p, offset))

		match_pairs = []
		for i in range(len(a_trans)):
			a_p = a_trans[i]

			# for every transformed point of A, find it's closest neighbor in B
			b_p, minDist = findClosestPointInB(b_data, a_p, [0.0,0.0,0.0])

			if minDist <= minMatchDist:

				# add to the list of match pairs less than 1.0 distance apart
				# keep A points and covariances untransformed
				Ca = a_data[i][2]

				Cb = b_p[2]

				# we store the untransformed point, but the transformed covariance of the A point
				match_pairs.append([a_data[i],b_p,Ca,Cb])


		# optimize the match error for the current list of match pairs
		newOffset = scipy.optimize.fmin(cost_func, offset, (match_pairs,))

		# get the current cost
		newCost = cost_func(newOffset, match_pairs)

		# check for convergence condition, different between last and current cost is below threshold
		if abs(lastCost - newCost) < costThresh:
			offset = newOffset
			lastCost = newCost
			break

		# save the current offset and cost
		offset = newOffset
		lastCost = newCost
		numIterations += 1

		# optionally draw the position of the points in current transform
		if plotIter:
			draw(a_trans,b_data, "ICP_plot_%04u.png" % numIterations)

	return offset

def draw(a_pnts, b_pnts, filename):

	for a in a_pnts:
		pylab.scatter([a[0]],[a[1]],linewidth=1, color='b')

	for b in b_pnts:
		pylab.scatter([b[0]],[b[1]],linewidth=1, color='r')

	pylab.xlim(-4.5,4.5)
	pylab.ylim(-4,4)
	pylab.savefig(filename)
	pylab.clf()

def align(data, target):
        # TODO: use heatmap of data and target
	# TUNE ME:  threshold cost difference between iterations to determine if converged
	costThresh = 0.004

	# TUNE ME:   minimum match distance before point is discarded from consideration
	minMatchDist = 2.0

	# plot the best fit at each iteration of the algorithm?
	plotIteration = False

	# initial guess for x, y, theta parameters
	offset = [0.0,0.0,-math.pi/4]

	# run generalized ICP (a plot is made for each iteration of the algorithm)
	#offset = gen_ICP(offset, data, target, costThresh, minMatchDist, plotIteration)

	#data_trans = []
	#for p in data:
		#data_trans.append(dispPoint(p, offset))

        #return data_trans
        return data

if __name__ == '__main__':

	# TUNE ME:  threshold cost difference between iterations to determine if converged
	costThresh = 0.004

	# TUNE ME:   minimum match distance before point is discarded from consideration
	minMatchDist = 2.0

	# plot the best fit at each iteration of the algorithm?
	plotIteration = False

	# initial guess for x, y, theta parameters
	offset = [0.0,0.0,-math.pi/4]

	# sample data
	a_data = [[1.0,1.0],[1.1,1.1],[1.2,1.2],[1.3,1.31],[1.4,1.4],[1.51,1.5],[1.6,1.6],[1.7,1.7]]
	b_data = [[0.3,1.0],[0.3,1.1],[0.3,1.2],[0.31,1.3],[0.3,1.4],[0.3,1.5],[0.3,1.6]]

	# plot the data without A transformed, plot 997
        draw(a_data, b_data, "rawData.png")

	# transform the points in A by 'offset'
	a_trans = []
	for p in a_data:
		a_trans.append(dispOffset(p, offset))

	# plot the data with A transformed, plot 998
        draw(a_trans, b_data, "initialGuess.png")

	# run generalized ICP (a plot is made for each iteration of the algorithm)
	offset = gen_ICP(offset, a_data, b_data, costThresh, minMatchDist, plotIteration)

	# transform the points of A with parameters determined by algorithm
	a_trans = []
	for p in a_data:
		a_trans.append(dispPoint(p, offset))

	# plot the final result, plot 999
        draw(a_trans, b_data, "finalOutput.png")

