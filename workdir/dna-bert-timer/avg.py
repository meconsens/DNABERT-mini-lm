import numpy as np

run1 = [0.6068952083587646,
1.7960920333862305,
6.382832765579224,
30.551825046539307
]

run2 = [
    0.6172072887420654,
1.7987370491027832, 
6.379435062408447,
31.02223038673401,
]

run3 = [
    0.4674339294433594,
1.1376349925994873,
3.696918487548828,
17.575069189071655,
]

run4= [
    0.4315824508666992,
0.8679592609405518,
2.704434871673584,
12.314972877502441
]

run5 = [
    0.49936556816101074,
1.099456548690796,
3.5386669635772705,
16.930200815200806,
]

all_runs = np.asarray([run1, run2, run3, run4, run5])
print(all_runs)
avgs = np.mean(all_runs, axis=0)
print(avgs)
