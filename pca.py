from matplotlib.mlab import PCA
import gen_icp as icp


def calculate(ids, matrix, target=None):
    results = PCA(matrix)
    data = []
    for obj_id, row in zip(ids, matrix):
        data.append([round(results.project(row)[0],6),
                round(results.project(row)[1],6)])
    #if len(target) > 0:
        #data = icp.align(data, target)
    data = icp.align(data, target)

    for obj_id, row in zip(ids, data):
        row.append(obj_id)
    return data
