from matplotlib.mlab import PCA


def calculate(ids, matrix):
    results = PCA(matrix)
    data = []
    for obj_id, row in zip(ids, matrix):
        data.append([round(results.project(row)[0],6),
                     round(results.project(row)[1],6),
                     obj_id])
    return data
