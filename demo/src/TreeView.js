import React, { useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { Tree, Input } from 'antd';
import { IFrameContext } from 'react-playground-iframe';
const { Search } = Input;

const dataList = [];
const generateList = data => {
    for (let i = 0; i < data.length; i++) {
        const node = data[i];
        const { key } = node;
        dataList.push({ key, title: key });
        if (node.children) {
            generateList(node.children);
        }
    }
};
const getParentKey = (key, tree) => {
    let parentKey;
    for (let i = 0; i < tree.length; i++) {
        const node = tree[i];
        if (node.children) {
            if (node.children.some(item => item.key === key)) {
                parentKey = node.key;
            } else if (getParentKey(key, node.children)) {
                parentKey = getParentKey(key, node.children);
            }
        }
    }
    return parentKey;
};

function getNpmData(modules)// ImportNPM to Tree Data
{
    let npm_infos = ImportNPM(modules);

    let treeData = npm_infos.map((v) => {

        return {
            title: v.name,
            key: v.name,
            children: Object.keys(v.module).map(m => {
                return {
                    title: m,
                    key: v.name + '/' + m,
                }
            })
        }
    });
    return treeData;
}

function ImportNPM(modules) { // Import NPM Module imported within <iframe>

    return modules.map((m) => {
        let module = document.getElementById('frame').contentWindow[m.split('@')[0].replace(/-/g, "_")];
        if (module !== undefined) {
            return {
                name: m,
                module: module
            }
        }
        else return null;
    });
}
export function SearchTree({ modules }) {
    const IframeData = useContext(IFrameContext);
    const [expandedKeys, SetExpandedKeys] = useState(['NPM Module']);
    const [searchValue, SetSearchValue] = useState('');
    const [checkedKeys, SetCheckedKeys] = useState([]);
    const [autoExpandParent, SetAutoExpandParent] = useState(true);
    const [Data, SetData] = useState([{
        title: 'NPM Module',
        key: 'NPM Module',
        children: [],
    }]);
    const onExpand = expandedKeys => {
        SetExpandedKeys(expandedKeys);
        SetAutoExpandParent(false);
    };
    useEffect(() => {
        dataList.splice(0, dataList.length);
        generateList(Data);
    }, [Data]);

    const onChange = e => {
        const { value } = e.target;
        const expandedKeys = dataList
            .map(item => {
                if (item.title.indexOf(value) > -1) {
                    return getParentKey(item.key, Data);
                }
                return null;
            })
            .filter((item, i, self) => item && self.indexOf(item) === i);
        SetExpandedKeys(expandedKeys);
        SetSearchValue(value);
        SetAutoExpandParent(true);
    };

    const loop = useCallback((data) => {
        return data.map((item) => {
            const index = item.title.indexOf(searchValue);
            const beforeStr = item.title.substr(0, index);
            const afterStr = item.title.substr(index + searchValue.length);
            const title =
                index > -1 ? (
                    <span>
                        {beforeStr}
                        <span className="site-tree-search-value">{searchValue}</span>
                        {afterStr}
                    </span>
                ) : (
                        <span>{item.title}</span>
                    );
            if (item.children) {
                return { title, key: item.key, children: loop(item.children) };
            }

            return {
                title,
                key: item.key,
            };
        });
}, [Data, searchValue]);

    useEffect(() => {
        if (IframeData.state.name === 'load_end') {
            SetData([{
                title: 'NPM Module',
                key: 'NPM Module',
                children: getNpmData(['React','ReactDOM',...modules]),
            }]);
        }

    }, [IframeData.state]);

    const onCheck = checkedKeys => {
        IframeData.SetIncludes(checkedKeys);
        SetCheckedKeys(checkedKeys);
    };

    return (
        <div>
            <Search style={{ marginBottom: 8 }} placeholder="Imported NPM module Finder" onChange={onChange} />
            <Tree
                checkable
                onExpand={onExpand}
                expandedKeys={expandedKeys}
                autoExpandParent={autoExpandParent}
                treeData={loop(Data)}
                onCheck={onCheck}
                checkedKeys={checkedKeys}
            />
        </div>
    )
}
