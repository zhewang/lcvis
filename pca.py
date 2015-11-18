from matplotlib.mlab import PCA


def calculate(ids, matrix, target=None):
    results = PCA(matrix)
    data = []
    for obj_id, row in zip(ids, matrix):
        data.append([round(results.project(row)[0],6),
                round(results.project(row)[1],6)])
    if target is not None:
        data = alignment(data, target)

    for obj_id, row in zip(ids, data):
        row.append(obj_id)
    return data


def alignment(data, target):
    pass

