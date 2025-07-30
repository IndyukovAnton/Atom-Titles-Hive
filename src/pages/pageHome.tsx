import React, { useState, useEffect } from 'react';

import type { tab } from "../components/tab"
import type { collection } from "../components/collection"

import { Tabs } from "../components/tabs"
import { CollectionList } from "../components/collectionList"

import { FormAddCollectionItem } from "../components/forms/add-collection"
import { FormAddGroup } from "../components/forms/add-group";

import "../assets/css/components/modal-window.css"

const HomePage = ()=> {
  const [collections, setСollections] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(1);
	const [activeCollection, setActiveCollection] = useState('')

	const [formAddItemIsOpen, openFormAddItem] = useState(false)
	const [formAddGroupIsOpen, openFormAddGroup] = useState(false)

	if (groups[0] && !activeCollection) {
		const activeGroup: string = groups[0].tag

		setActiveCollection(activeGroup)
	}

	function switchActiveCollection(event) {
		setActiveCollection(event.currentTarget.dataset.tab)
	}

  useEffect(() => {
    fetch('http://127.0.0.1:3000/groups')
      .then(response => response.json())
      .then(data => {
        setGroups(data);
        setLoading(0);
      })
      .catch(error => {
        console.error('Ошибка:', error);
        setLoading(-1);
      });
  }, []);

  useEffect(() => {
    fetch('http://127.0.0.1:3000/collections')
      .then(response => response.json())
      .then(data => {
        setСollections(data);
        setLoading(0);
      })
      .catch(error => {
        console.error('Ошибка:', error);
        setLoading(-1);
      });
  }, []);

  if (loading === 1) return <p className="loading">Загрузка...</p>;

	switch (loading) {
		case 1:
			return <p className="loading">Загрузка...</p>;
		case -1:
			return <p className="error">Произошла ошибка во время загрузки!</p>;
	}

	return (
		<div className="home">
			<div className="top__buttons">
				<button className="btn-add" onClick={()=> {
					openFormAddItem(true)
				}}>Добавить тайтл</button>
				<button className="btn-add" onClick={()=> {
					openFormAddGroup(true)
				}}>Добавить группу</button>
			</div>

			<Tabs tabs={groups} active={activeCollection} clickHandler={switchActiveCollection}></Tabs>

			{groups.map((group, index) => {
				return <CollectionList key={index} group={group.tag} collections={collections} activeGroup={activeCollection}></CollectionList>
			})}

			<div className={"modal-window" + (formAddItemIsOpen ? " opened" : " closed")}>
				<div className="modal-window__overlay" onClick={()=> {
					openFormAddItem(false)
				}}></div>
				<div className="modal-window__wrapper">
					<div className="modal-window__content">
						<FormAddCollectionItem groups={groups}/>
					</div>
				</div>
			</div>

			<div className={"modal-window" + (formAddGroupIsOpen ? " opened" : " closed")}>
				<div className="modal-window__overlay" onClick={()=> {
					openFormAddGroup(false)
				}}></div>
				<div className="modal-window__wrapper">
					<div className="modal-window__content">
						<FormAddGroup/>
					</div>
				</div>
			</div>
		</div>
	)
}

export { HomePage }