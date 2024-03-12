import os
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
import numpy as np
import re
import cv2
import codecs
import base64
import requests
import json
import traceback

# import imutils


def check_screenshot():
    # 创建一个新的文件夹
    os.makedirs("screen-result", exist_ok=True)

    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_argument("--user-data-dir=/tmp/cache-dir")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--headless")

    # open the page
    driver = webdriver.Chrome(options=chrome_options)
    driver.set_window_size(1280, 720)

    urls = [
        "https://tidy3d.dev-simulation.cloud/workbench?taskId=pa-734c1c1d-e397-41f7-b0cd-f9f11e11be0c",  # Ring resonator
        # "https://tidy3d.dev-simulation.cloud/workbench?taskId=pa-7c1605ac-9d48-4ea2-be5e-356e376c9487",  # Photonic crystal cavity
        # "https://tidy3d.dev-simulation.cloud/workbench?taskId=pa-431bfe46-c1f4-49cb-9c3c-93ac15d34817",  # Edge coupler
        # "https://tidy3d.dev-simulation.cloud/workbench?taskId=pa-14f0dcad-b4fb-4c0c-91b0-a29361118c68",  # Directional coupler
        # "https://tidy3d.dev-simulation.cloud/workbench?taskId=pa-818cdc48-0baa-4bd1-b7ae-e8d2b83339cd",  # PhC slab polarization filter
        # "https://tidy3d.dev-simulation.cloud/workbench?taskId=pa-08bb60af-621d-492d-825f-a047fe8e6c80",  # Zone plate
        # "https://tidy3d.dev-simulation.cloud/workbench?taskId=pa-86b54f6b-a85e-47f7-bb4c-caa54f919c60",  # Metalens
        # "https://tidy3d.dev-simulation.cloud/workbench?taskId=pa-adcaef19-324f-49ba-b388-944cde4e9d53",  # Gradient metasurface reflector
        # "https://tidy3d.dev-simulation.cloud/workbench?taskId=pa-9e546237-71fa-461b-9dff-5e64de4025aa",  # Compact 2 by 2 MMI power splitter
        # "https://tidy3d.dev-simulation.cloud/workbench?taskId=pa-1235d143-ef75-43cb-b89c-b022bc769735",  # Polarization splitter rotator
    ]

    error_count = 0
    for url in urls:
        driver.get(url)
        time.sleep(15)

        # case_name = driver.find_element(
        #     By.XPATH,
        #     "/html/body/app-root/app-workbench/app-workbench-toolbar/div/app-input/input",
        # ).get_attribute("value")
        # helperElement = driver.find_element(By.XPATH, "/html/body/div")
        # driver.execute_script(
        #     "arguments[0].style.visibility = 'hidden';", helperElement
        # )

        # 执行 JavaScript 代码并获取返回值
        result = driver.execute_script('return window.get3dScreenshot()')
        print(result)
        # 解码 Base64 数据
        image_data = base64.b64decode(result)
        suffix = "-new" if os.getenv("Action_Mode") == "compare" else ""
        with open(f"./screen-result/{case_name}{suffix}.png", "wb") as f:
            f.write(image_data)
        # driver.save_screenshot(f"./screen-result/{case_name}{suffix}.png")
        print("*****case_name:", case_name)
        return 
        if os.getenv("Action_Mode") != "generate":
            if compare_screenshots(
                f"./screen-result/{case_name}-new.png",
                f"{os.getcwd()}/.github/workflows/standard/{case_name}.png",
            ):
                os.remove(f"./screen-result/{case_name}-new.png")
            else:
                error_count += 1

    simulationViewWork = "Normal"
    # simulation view auto test
    try:
        driver.get(
            "https://feature-simulation-viewer.d3a9gfg7glllfq.amplifyapp.com/simulation-viewer"
        )
        element_2 = driver.find_element(
            By.XPATH,
            "/html/body/app-root/simulation-viewer/div[1]",
        )
    except:
        print("simulation view fail")
        simulationViewWork = "Error"
        traceback.print_exc()

    print("*****simulation-view:", {simulationViewWork})
    data = {
        "msg": f"Scheduled Test Job: {error_count} / {len(urls)} cases error,  simulation-view {simulationViewWork}",
        "link": f"https://github.com/flexcompute/photonforge-view-tool/actions/runs/{os.getenv('GITHUB_RUN_ID')}",
    }
    requests.post(
        "https://www.larksuite.com/flow/api/trigger-webhook/3dfbd547cbdb74b01307d9d884c04e6a",
        data=json.dumps(data),
        headers={"Content-Type": "application/json"},
    )

    # script = "var canvas = document.getElementById('three-viewer').children[0];var dataURL = canvas.toDataURL('image/jpeg');return dataURL;"
    # canvas_data_url = driver.execute_script(script)
    # canvas_data = canvas_data_url.split(',')[1]
    # canvas_bytes = base64.b64decode(canvas_data)
    # nparr = np.frombuffer(canvas_bytes, np.uint8)
    # image_np = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    # cv2.imwrite('./canvas_screenshot2.jpg', image_np)

    # driver.get("https://tidy3d.dev-simulation.cloud/workbench?taskId=pa-30b5af2f-89f5-4209-94a9-f333b14eebe2")
    # time.sleep(15)
    # driver.save_screenshot('./element_3.png')

    # driver.quit()

    # Find widget
    # element_1 = driver.find_element(By.XPATH, './/section[contains(@data-com-id,"com-cms-cg-mktg-component-promo")]')
    # element_1.screenshot(origin_screen_path)

    # Change style and take new screenshot
    # class_attr = element_1.get_attribute("class")
    # class_attr = re.sub('cgmt-bgcolor-.*\n', 'cgmt-bgcolor-gray01', class_attr)
    # class_attr = re.sub('\n', ' ', class_attr)
    # driver.execute_script("arguments[0].setAttribute('class', '"+class_attr+"')", element_1)
    # element_1.screenshot(new_screen_path)

    # Compare screenshot
    # compare_screenshots('element_2.png', 'element_2n.png')


def compare_screenshots(path1, path2):
    image1 = cv2.imread(path1)
    image2 = cv2.imread(path2)

    # 将图像转换为灰度图像
    gray1 = cv2.cvtColor(image1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(image2, cv2.COLOR_BGR2GRAY)

    # 计算直方图
    hist1 = cv2.calcHist([gray1], [0], None, [256], [0, 256])
    hist2 = cv2.calcHist([gray2], [0], None, [256], [0, 256])

    # 归一化直方图
    cv2.normalize(hist1, hist1, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
    cv2.normalize(hist2, hist2, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)

    # 计算巴氏距离
    bhatta_dist = cv2.compareHist(hist1, hist2, cv2.HISTCMP_BHATTACHARYYA)

    # 计算相关性
    corr = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)

    # 计算卡方
    chisq = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CHISQR)

    # 输出结果
    print("巴氏距离：", bhatta_dist)
    print("卡方：", chisq)
    print("相关性：", corr)
    if abs(corr - 1) > 0.000001:
        print("--------Not Same")
        return False
    print("----------Same")
    return True


if __name__ == "__main__":
    check_screenshot()
